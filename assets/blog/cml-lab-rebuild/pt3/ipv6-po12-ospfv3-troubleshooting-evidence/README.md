# IPv6 Po12 OSPFv3 troubleshooting evidence

These screenshots support the troubleshooting narrative for the HQ-DSW-01 to HQ-DSW-02 Layer-3 LACP Port-channel12.

| File | What it proves |
|---|---|
| 01_ipv6_routes_before_po12.png | IPv6 routing had no usable Po12 path before OSPFv3 was added to the bundle. |
| 02a_po12_ipv6_addressing.png | Both Port-channel12 interfaces have distinct IPv6 addresses. |
| 02b_po12_dual_stack_config.png | Layer 3 and OSPF configuration belongs on the logical Port-channel, not its physical members. |
| 03_direct_ipv6_ping_across_po12.png | IPv6 unicast forwarding across Po12 worked when the source was stated explicitly. |
| 04_dsw1_po12_missing_from_ospfv3.png | DSW1 initially did not register Po12 as an OSPFv3 interface, while DSW2 did. |
| 05_distinct_portchannel_macs.png | The two logical EtherChannel interfaces had different MAC addresses, ruling out a MAC collision. |
| 06_po12_attached_no_neighbors.png | Po12 was registered on both switches, but both still had zero OSPFv3 neighbours. |
| 07_dsw1_passive_interface_root_cause.png | DSW1 reported `No Hellos (Passive interface)`, identifying the operational cause. |
| 08_ff02_allspfrouters_membership.png | Both sides had joined FF02::5, confirming OSPFv3 multicast group membership. |
| 09_passive_override_full_adjacency.png | Refreshing the DSW1 passive-interface override resulted in OSPFv3 FULL adjacency. |

Keep the story focused: this was an IOSv/CML control-plane state issue after adding IPv6 to an existing Port-channel, not a reason to use manual link-local addressing as a standard practice.
