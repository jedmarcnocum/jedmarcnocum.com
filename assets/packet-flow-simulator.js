(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-packet-flow]").forEach((simulator) => {
    const packets = [...simulator.querySelectorAll("[data-packet-flow-packet]")];
    const nodes = [...simulator.querySelectorAll("[data-packet-flow-node]")];
    const links = [...simulator.querySelectorAll("[data-packet-flow-link]")];
    const previousButton = simulator.querySelector('[data-packet-flow-action="previous"]');
    const nextButton = simulator.querySelector('[data-packet-flow-action="next"]');
    const playButton = simulator.querySelector('[data-packet-flow-action="play"]');
    const resetButton = simulator.querySelector('[data-packet-flow-action="reset"]');
    const progress = simulator.querySelector("[data-packet-flow-progress]");
    const phase = simulator.querySelector("[data-packet-flow-phase]");
    const title = simulator.querySelector("[data-packet-flow-title]");
    const description = simulator.querySelector("[data-packet-flow-description]");
    const svg = simulator.querySelector("svg");
    const callout = simulator.querySelector("[data-packet-flow-callout]");

    const coordinates = {
      asw: [{ x: 95, y: 190 }, { x: 95, y: 228 }],
      dsw: [{ x: 390, y: 105 }, { x: 390, y: 325 }],
      edge: [{ x: 695, y: 190 }, { x: 695, y: 228 }],
    };
    const ecmpLinks = ["asw-dsw1", "asw-dsw2"];
    const coreLinks = ["dsw1-edge", "dsw2-edge"];

    const steps = [
      {
        phase: "Traceroute probes",
        title: "HQ-ASW-01 launches a probe set",
        description: "The access switch has two OSPF next hops of equal cost toward HQ-EDGE-01. Two sample probes begin here so both active ECMP paths can be observed.",
        points: coordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw"],
        links: [],
        reply: false,
      },
      {
        phase: "Traceroute probes",
        title: "Both equal-cost distribution paths are available",
        description: "Probe A is at HQ-DSW-01 and probe B at HQ-DSW-02. The responses observed from 10.254.1.7 and 10.254.1.9 first hop confirms ECMP.",
        points: coordinates.dsw,
        callout: { x: 535, y: 16 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ecmpLinks,
        reply: false,
      },
      {
        phase: "Traceroute probes",
        title: "Both routed paths reach the edge",
        description: "The two core paths arrive at HQ-EDGE-01. The 10.254.1.5 and 10.254.1.3 hop 2 results confirm they continue in parallel.",
        points: coordinates.edge,
        callout: { x: 720, y: 270 },
        nodes: ["dsw1", "dsw2", "edge"],
        links: coreLinks,
        reply: false,
      },
      {
        phase: "ICMP echo reply",
        title: "HQ-EDGE-01 answers both sample probes",
        description: "HQ-EDGE-01 receives both samples and sends blue echo replies into the routed core.",
        points: coordinates.edge,
        callout: { x: 720, y: 270 },
        nodes: ["edge"],
        links: [],
        reply: true,
      },
      {
        phase: "ICMP echo reply",
        title: "Replies traverse both ECMP branches",
        description: "The replies cross the edge uplinks to both distribution switches. Return flows can choose either equal-cost path.",
        points: coordinates.dsw,
        callout: { x: 535, y: 16 },
        nodes: ["edge", "dsw1", "dsw2"],
        links: coreLinks,
        reply: true,
      },
      {
        phase: "Path validation complete",
        title: "HQ-ASW-01 receives both replies",
        description: "Both samples reach the access layer, validating the gateways, OSPF routes, and resilient ECMP paths.",
        points: coordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ecmpLinks,
        reply: true,
      },
    ];

    let step = 0;
    let previousPoints;
    let previousCalloutPoint;
    let animationFrame;
    let playbackTimer;
    let isPlaying = false;

    const movePacketTo = (packet, point) => {
      packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
    };

    const moveCalloutTo = (point) => {
      callout.setAttribute("transform", `translate(${point.x} ${point.y})`);
    };

    const animatePackets = (points, calloutPoint, animate) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);

      if (!previousPoints || !animate || prefersReducedMotion.matches) {
        packets.forEach((packet, index) => movePacketTo(packet, points[index]));
        moveCalloutTo(calloutPoint);
        previousPoints = points;
        previousCalloutPoint = calloutPoint;
        return;
      }

      const startedAt = performance.now();
      const duration = 420;
      const from = previousPoints;
      const calloutFrom = previousCalloutPoint;

      const tick = (now) => {
        const elapsed = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - (1 - elapsed) ** 3;
        packets.forEach((packet, index) => {
          const start = from[index];
          const end = points[index];
          movePacketTo(packet, {
            x: start.x + (end.x - start.x) * eased,
            y: start.y + (end.y - start.y) * eased,
          });
        });
        moveCalloutTo({
          x: calloutFrom.x + (calloutPoint.x - calloutFrom.x) * eased,
          y: calloutFrom.y + (calloutPoint.y - calloutFrom.y) * eased,
        });
        if (elapsed < 1) animationFrame = requestAnimationFrame(tick);
      };

      animationFrame = requestAnimationFrame(tick);
      previousPoints = points;
      previousCalloutPoint = calloutPoint;
    };

    const stopPlayback = () => {
      isPlaying = false;
      window.clearTimeout(playbackTimer);
    };

    const render = (animate = true) => {
      const current = steps[step];

      simulator.classList.toggle("is-reply", current.reply);
      packets.forEach((packet) => packet.classList.add("is-visible"));
      animatePackets(current.points, current.callout, animate);

      nodes.forEach((node) => {
        node.classList.toggle("is-active", current.nodes.includes(node.dataset.packetFlowNode));
      });
      links.forEach((link) => {
        link.classList.toggle("is-active", current.links.includes(link.dataset.packetFlowLink));
      });

      progress.textContent = `Step ${step + 1} of ${steps.length}`;
      phase.textContent = current.phase;
      title.textContent = current.title;
      description.textContent = current.description;
      svg.setAttribute("aria-label", `${current.title}. ${current.description}`);
      previousButton.disabled = step === 0;
      nextButton.disabled = step === steps.length - 1;
      if (nextButton.disabled) stopPlayback();
      playButton.disabled = nextButton.disabled;
      playButton.setAttribute("aria-pressed", String(isPlaying));
      playButton.setAttribute("aria-label", isPlaying ? "Pause packet-flow playback" : "Play packet-flow playback");
      playButton.textContent = isPlaying ? "\u23F8 Pause" : "\u25B6 Play";
    };

    const advance = () => {
      step = Math.min(steps.length - 1, step + 1);
      render();
    };

    const schedulePlayback = () => {
      window.clearTimeout(playbackTimer);
      if (!isPlaying || step === steps.length - 1) return;

      playbackTimer = window.setTimeout(() => {
        advance();
        schedulePlayback();
      }, 1000);
    };

    previousButton.addEventListener("click", () => {
      stopPlayback();
      step = Math.max(0, step - 1);
      render();
    });
    nextButton.addEventListener("click", () => {
      stopPlayback();
      advance();
    });
    playButton.addEventListener("click", () => {
      if (isPlaying) {
        stopPlayback();
        render(false);
        return;
      }

      isPlaying = true;
      render(false);
      schedulePlayback();
    });
    resetButton.addEventListener("click", () => {
      stopPlayback();
      step = 0;
      previousPoints = undefined;
      previousCalloutPoint = undefined;
      render(false);
    });

    render(false);
  });
})();
