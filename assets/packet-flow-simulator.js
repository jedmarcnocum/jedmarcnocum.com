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
    const isResiliencySimulation = simulator.dataset.packetFlow === "resiliency";
    const isLacpResiliencySimulation = simulator.dataset.packetFlow === "lacp-resiliency";

    const coordinates = {
      asw: [{ x: 95, y: 190 }, { x: 95, y: 228 }],
      dsw: [{ x: 390, y: 105 }, { x: 390, y: 325 }],
      edge: [{ x: 695, y: 190 }, { x: 695, y: 228 }],
    };
    const ecmpLinks = ["asw-dsw1", "asw-dsw2"];
    const coreLinks = ["dsw1-edge", "dsw2-edge"];
    const dsw1FailureLinks = ["asw-dsw1", "dsw1-edge", "dsw1-dsw2"];
    const resiliencyCoordinates = {
      asw: [{ x: 95, y: 210 }],
      dsw2: [{ x: 390, y: 325 }],
      edge: [{ x: 695, y: 210 }],
    };
    const lacpCoordinates = {
      asw: [{ x: 135, y: 210 }],
      dsw1: [{ x: 430, y: 210 }],
      dsw2: [{ x: 735, y: 210 }],
    };
    const resiliencySteps = [
      {
        phase: "Healthy ECMP topology",
        title: "Both equal-cost paths are available",
        description: "Before the test, OSPF has a path through each distribution switch. Traffic can use HQ-DSW-01 or HQ-DSW-02 toward HQ-EDGE-01.",
        points: resiliencyCoordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw1", "dsw2", "edge"],
        links: [...ecmpLinks, ...coreLinks],
        reply: false,
      },
      {
        phase: "Failure injected",
        title: "HQ-DSW-01 is taken down for testing",
        description: "The DSW1-facing access, core, and peer links are unavailable. OSPF detects the loss and removes that branch from the active topology.",
        points: resiliencyCoordinates.asw,
        callout: { x: 535, y: 16 },
        nodes: ["asw", "dsw2", "edge"],
        links: ["asw-dsw2", "dsw2-edge"],
        failedNodes: ["dsw1"],
        failedLinks: dsw1FailureLinks,
        reply: false,
      },
      {
        phase: "OSPF convergence",
        title: "HQ-DSW-02 becomes the surviving next hop",
        description: "The remaining OSPF route points toward HQ-DSW-02, so the IPv6 traceroute probe leaves HQ-ASW-01 over the live branch.",
        points: resiliencyCoordinates.dsw2,
        callout: { x: 535, y: 16 },
        nodes: ["asw", "dsw2"],
        links: ["asw-dsw2"],
        failedNodes: ["dsw1"],
        failedLinks: dsw1FailureLinks,
        reply: false,
      },
      {
        phase: "IPv6 traceroute probe",
        title: "The surviving path reaches HQ-EDGE-01",
        description: "The probe crosses HQ-DSW-02 to the edge. The observed IPv6 hops confirm that traffic still reaches 2001:DB8:1:FFFF::10 after the DSW1 failure.",
        points: resiliencyCoordinates.edge,
        callout: { x: 720, y: 270 },
        nodes: ["dsw2", "edge"],
        links: ["dsw2-edge"],
        failedNodes: ["dsw1"],
        failedLinks: dsw1FailureLinks,
        reply: false,
      },
      {
        phase: "ICMP response",
        title: "The response returns on the live branch",
        description: "HQ-EDGE-01 returns the response through HQ-DSW-02. The failed DSW1 path remains excluded while the remaining route carries traffic.",
        points: resiliencyCoordinates.dsw2,
        callout: { x: 535, y: 16 },
        nodes: ["edge", "dsw2"],
        links: ["dsw2-edge"],
        failedNodes: ["dsw1"],
        failedLinks: dsw1FailureLinks,
        reply: true,
      },
      {
        phase: "Resiliency validated",
        title: "HQ-ASW-01 remains connected",
        description: "The reply reaches the access layer over HQ-DSW-02. ECMP has degraded to one working path, preserving reachability without a manual route change.",
        points: resiliencyCoordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw2"],
        links: ["asw-dsw2"],
        failedNodes: ["dsw1"],
        failedLinks: dsw1FailureLinks,
        reply: true,
      },
    ];
    const lacpResiliencySteps = [
      {
        phase: "Healthy LACP bundle",
        title: "Port-channel12 starts with two active members",
        description: "GigabitEthernet0/1 and GigabitEthernet0/2 form one Layer-3 LACP EtherChannel. OSPFv2 and OSPFv3 run on logical Port-channel12, not on either individual member.",
        points: lacpCoordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ["asw-dsw1", "po12-gi01", "po12-gi02"],
        reply: false,
      },
      {
        phase: "One-sided shutdown",
        title: "Gi0/2 is removed only on HQ-DSW-01",
        description: "HQ-DSW-01 removes the member locally, but HQ-DSW-02 temporarily still reports it as bundled. This is the observed CML/IOSv emulation edge case.",
        points: lacpCoordinates.dsw1,
        callout: { x: 300, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        warningNodes: ["dsw2"],
        links: ["asw-dsw1", "po12-gi01"],
        warningLinks: ["po12-gi02"],
        reply: false,
      },
      {
        phase: "Delayed reconvergence",
        title: "The stale remote state is not seamless resiliency",
        description: "HQ-DSW-02 can still send traffic and OSPF Hellos toward the unavailable member until the adjacency reaches its dead timer. The earlier 88% ping result is loss, not a successful failover test.",
        points: lacpCoordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        warningNodes: ["dsw2"],
        links: ["asw-dsw1", "po12-gi01"],
        warningLinks: ["po12-gi02"],
        reply: false,
      },
      {
        phase: "Controlled member removal",
        title: "Gi0/2 is removed on both distribution switches",
        description: "Removing the same member administratively on both ends makes the bundle state agree immediately. Port-channel12 stays up over GigabitEthernet0/1.",
        points: lacpCoordinates.dsw1,
        callout: { x: 300, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ["asw-dsw1", "po12-gi01"],
        failedLinks: ["po12-gi02"],
        reply: false,
      },
      {
        phase: "OSPF remains FULL",
        title: "The logical routed link keeps carrying service",
        description: "The ping flow crosses Port-channel12 on its remaining member. The test proves the logical route and OSPF adjacency remain available; it does not prove that any prior flow used the removed member.",
        points: lacpCoordinates.dsw2,
        callout: { x: 690, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ["asw-dsw1", "po12-gi01"],
        failedLinks: ["po12-gi02"],
        reply: false,
      },
      {
        phase: "Controlled test passed",
        title: "HQ-ASW-01 completes 1000 of 1000 pings",
        description: "With Gi0/2 removed at both ends, Port-channel12 and OSPF stay established. HQ-ASW-01 retains uninterrupted reachability to HQ-DSW-02 Loopback0 at 10.255.1.2.",
        points: lacpCoordinates.asw,
        callout: { x: 20, y: 270 },
        nodes: ["asw", "dsw1", "dsw2"],
        links: ["asw-dsw1", "po12-gi01"],
        failedLinks: ["po12-gi02"],
        reply: true,
      },
    ];

    const normalSteps = [
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
    const steps = isLacpResiliencySimulation ? lacpResiliencySteps : isResiliencySimulation ? resiliencySteps : normalSteps;

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
        node.classList.toggle("is-failed", (current.failedNodes || []).includes(node.dataset.packetFlowNode));
        node.classList.toggle("is-warning", (current.warningNodes || []).includes(node.dataset.packetFlowNode));
      });
      links.forEach((link) => {
        link.classList.toggle("is-active", current.links.includes(link.dataset.packetFlowLink));
        link.classList.toggle("is-failed", (current.failedLinks || []).includes(link.dataset.packetFlowLink));
        link.classList.toggle("is-warning", (current.warningLinks || []).includes(link.dataset.packetFlowLink));
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
