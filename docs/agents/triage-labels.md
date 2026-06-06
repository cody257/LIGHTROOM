# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's tracker (Linear).

| Canonical role    | Label in Linear   | Meaning                                  |
| ----------------- | ----------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`    | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`      | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human` | Requires human implementation            |
| `wontfix`         | `wontfix`         | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

These triage-state labels don't exist in Linear yet — create each one on first use with `create_issue_label` (team `Copperstateit`). They're orthogonal to the existing **type** labels (`Bug`, `Feature`, `Improvement`, `Security`), which classify *what* an issue is rather than *where it sits* in triage.

Edit the right-hand column if you later adopt different vocabulary.
