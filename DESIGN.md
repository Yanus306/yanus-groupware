# Octo Code

## Overview
Octo Code is a developer-centric design system inspired by the world's largest code collaboration platform. It embraces a dark-mode-first philosophy with precise syntax-highlighting-friendly colors, clean typography, and an interface that puts code front and center. The aesthetic is functional, information-dense, and unapologetically built for people who live in terminals and pull requests.

## Colors
- **Primary** (#2F81F7): Interactive elements, links, buttons, selected states — Mona Blue
- **Primary Hover** (#388BFD): Hovered links and buttons, slightly brighter for affordance
- **Secondary** (#238636): Merge buttons, success states, additions in diffs — Growth Green
- **Neutral** (#8B949E): Secondary text, icons, timestamps, subtle labels
- **Background** (#0D1117): Page background, the foundation dark canvas — Void Black
- **Surface** (#161B22): Cards, panels, sidebar backgrounds, elevated containers
- **Text Primary** (#E6EDF3): Primary text, headings, code content — high contrast on dark
- **Text Secondary** (#8B949E): Descriptions, meta information, secondary labels
- **Border** (#30363D): Dividers, card borders, input outlines, table rules
- **Success** (#3FB950): Successful checks, merged PRs, online indicators
- **Warning** (#D29922): Pending reviews, draft states, caution alerts
- **Error** (#F85149): Failed checks, merge conflicts, destructive actions

## Typography
- **Display Font**: Inter — loaded from Google Fonts
- **Body Font**: Inter — loaded from Google Fonts
- **Code Font**: JetBrains Mono — loaded from Google Fonts

Inter is used at weights 400, 500, and 600 across all non-code UI. Display headings use 600 weight with -0.02em letter-spacing for a tight, engineered feel. Body text sits at 400 weight with default letter-spacing for comfortable reading of issues, comments, and documentation. JetBrains Mono renders all code blocks, inline code, diffs, commit SHAs, and terminal output at 400 weight with ligatures enabled. The type scale is compact to maximize information density: 12px (meta/labels), 14px (body/default), 16px (section titles), 20px (page titles), 24px (repo names), 32px (marketing headings).

## Elevation
Elevation is expressed through background color layering rather than shadows. The base layer is #0D1117, cards and panels lift to #161B22, popovers and dropdowns to #1C2128, and modals to #21262D with a semi-transparent backdrop overlay at rgba(1, 4, 9, 0.8). Subtle box-shadows of 0 1px 0 rgba(27, 31, 36, 0.04) are used sparingly on sticky headers and floating action bars. The philosophy is flat and layered — depth comes from color differentiation, not shadow theatrics.

## Components
- **Buttons**: Primary uses #238636 background with #FFFFFF text, 6px radius, 12px 20px padding, 500 weight. Danger variant uses transparent background with #F85149 text, bordered. Outline variant uses transparent background, #30363D border, #C9D1D9 text. All buttons are 32px default height with a 28px small variant. Hover states brighten background by ~10%.
- **Cards**: #161B22 background, 1px solid #30363D border, 6px radius, 16px padding. Repository cards show name in #58A6FF link color, description in #8B949E, and language dot + star count in the footer. Hover adds a subtle border color shift to #484F58.
- **Inputs**: #0D1117 background, 1px solid #30363D border, 6px radius, 8px 12px padding, 14px font size. Focus state applies 2px solid #2F81F7 outline with 2px offset. Placeholder text in #484F58. Search inputs have a / keyboard shortcut hint badge.
- **Chips**: Used for labels and topics. 24px height, 12px horizontal padding, 9999px radius (pill), 12px font, 500 weight. Label chips use their assigned color as background at 30% opacity with full-color text. Topic chips use #1C2128 background with #58A6FF text.
- **Lists**: Repository and file lists use full-width rows with 8px 16px padding, #30363D bottom border (1px). Hover highlights row to #161B22. Selected/active rows get a 2px left border in #F78166 (orange accent).
- **Checkboxes**: 16x16px, #0D1117 background, 1px solid #30363D border, 3px radius. Checked state fills #2F81F7 with white checkmark SVG. Used prominently in task lists within issues and PRs.
- **Tooltips**: #21262D background, #C9D1D9 text, 6px radius, 6px 10px padding, 12px font. Arrow-tipped, positioned above by default. 200ms delay on hover. Max-width 250px.
- **Navigation**: Top nav is #161B22 with 1px bottom border #21262D, 64px height. Tab navigation uses underline-style active indicator — 2px bottom border in #F78166 (orange) for active tab, #8B949E text for inactive. Sidebar nav uses #0D1117 background with hover highlight rows; the active item uses the primary blue (`#2F81F7`) for its 2px left rail and icon, with a restrained primary surface tint. Warning yellow is reserved for pending, draft, and caution states, not navigation selection.
- **Search**: Prominent top-bar search with #0D1117 background, #30363D border, 6px radius. Activated state expands to full-width overlay with typeahead suggestions on #161B22 dropdown. Search shortcut / displayed as a muted kbd badge.

## Spacing
- Base unit: 4px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px
- Component padding: Buttons 12px 20px, inputs 8px 12px, cards 16px, chips 4px 12px
- Section spacing: 24px between content sections, 48px between major page sections
- Container max width: 1280px (wide layout), 1012px (readable content), 768px (narrow/settings)
- Card grid gap: 16px between repository cards, 0px for list views (border-separated)

## Border Radius
- 3px: Checkboxes, small badges, inline code snippets
- 6px: Buttons, inputs, cards, dropdowns, modals, most components
- 12px: Avatar images, large promotional cards
- 20px: Marketing page hero elements, onboarding cards
- 9999px: Pills, label chips, topic tags, notification counters

## Do's and Don'ts
- Do use the dark palette as the default — light mode is secondary
- Do use JetBrains Mono for anything code-related: diffs, SHAs, file names, terminal output
- Do rely on color layering (#0D1117 > #161B22 > #1C2128) for visual hierarchy instead of shadows
- Do keep information density high — developers prefer seeing more data with less scrolling
- Don't use more than 600 weight for any text — the interface should feel precise, not loud
- Don't use rounded corners larger than 6px on functional UI elements
- Don't animate transitions longer than 150ms — the interface should feel instant
- Don't use the primary blue (#2F81F7) for large background fills — reserve it for interactive elements and links

## Issue #414 — App-wide redesign

Issue #414 extends the Octo Code contract from the attendance surface to every route. The
redesign is a visual and interaction-system refactor: existing API calls, permission guards,
state ownership, route semantics, and user-visible data remain unchanged.

### Route inventory

Authenticated routes share one application shell:

`/` dashboard, `/chat` chat, `/calendar` calendar and tasks, `/attendance` attendance,
`/work-schedules` work schedules, `/drive` drive, `/ai` AI chat, `/members` members,
`/my-page` profile/settings, `/team-management` team management, and `/admin` administration.

Public routes use the same tokens without the authenticated shell:

`/login`, `/register`, and `/verify-email`.

### Shared surface contract

- **App shell**: a 200px desktop sidebar, a 64px topbar, and a fixed bottom navigation at
  narrow widths. The content region is capped at 1280px with `20–32px` gutters and always
  reserves bottom-bar clearance on touch layouts.
- **Page header**: one eyebrow, one Korean page title, one concise description, and a right-side
  action group. Header actions never compete with the page title on mobile.
- **Surface**: cards, tables, lists, forms, drawers, and modals use `#161B22`, a 1px
  `#30363D` border, a maximum 6px radius, and layered backgrounds instead of blur or decorative
  gradients.
- **Controls**: primary actions use Mona Blue or Growth Green only when the action is a merge/
  success operation. Secondary controls are bordered and transparent. Inputs are 36px high on
  desktop and at least 44px high for touch-critical actions.
- **Data display**: dense information uses border-separated rows, compact metadata, and explicit
  empty/loading/error states in the same region as the data. Tables scroll inside their surface;
  the page itself never gains horizontal overflow.
- **Feedback**: every status includes text plus an icon, border, or layout cue. `#D29922` is
  reserved for pending, draft, and caution feedback; it is never used to indicate navigation
  selection. Errors use `#F85149`, success uses `#3FB950`, and informational selection uses
  `#2F81F7`.
- **Overlays**: popovers use `#1C2128`, modals use `#21262D`, and the backdrop uses the Octo
  overlay token. Functional overlays keep the 6px radius and provide labelled close/focus paths.

### Page family rules

- **Dashboard** prioritizes the current attendance action, then schedule, chat, and tasks in a
  compact grid. Empty cards explain what the user can do next.
- **Chat, calendar, and work schedules** keep their existing interaction models, but use shared
  toolbars, bordered panels, blue selection, and compact rows. FullCalendar's DOM remains a
  vendor boundary and inherits the same tokens.
- **Attendance, members, team management, and admin** use the same table, search, filter,
  status-badge, modal, and responsive row language. Role guards and data scope are unchanged.
- **Drive and AI chat** use repository-like lists and code-friendly message surfaces. Markdown
  and code retain JetBrains Mono; conversational bubbles do not use purple gradients.
- **My Page** uses a narrow readable form column with section dividers, explicit save feedback,
  and a separate danger zone.
- **Auth routes** use the base background, a bordered 6px form surface, restrained branding,
  and one primary action. Decorative glass, blur, and full-page purple gradients are removed.

### Responsive, theme, and accessibility rules

- Reference widths are `390px`, `768px`, and `1280px`. At each width, `scrollWidth` must not
  exceed the viewport width and all dense data must remain readable without clipped CJK text.
- Mobile layouts collapse by priority, not by shrinking every control. Tables become scrollable
  regions or labelled rows, and fixed navigation always has at least `56px` of content clearance.
- Dark mode remains the default. The explicit `data-theme="light"` preference maps every surface,
  border, text, state, and input token to a readable light alias; the system preference does not
  silently override the user's stored theme.
- Korean headings use `text-wrap: pretty` where supported, body copy uses a readable line-height,
  and no page relies on color alone. Every interactive element keeps a visible `:focus-visible`
  ring and a minimum 36px target (44px for primary touch actions).
- Motion is limited to 120ms state transitions. `prefers-reduced-motion: reduce` disables
  non-essential transitions and animated decoration.

### Implementation boundary and accepted debt

The app-wide layer owns tokens, shell geometry, shared surface language, state colors, responsive
guards, and cross-route visual overrides. Existing page CSS owns only route-specific composition
and vendor integration. API, Context, route guard, mock, and permission changes are out of scope.
The remaining FullCalendar vendor markup and existing bundle chunk-size warning are recorded as
accepted debt unless they block a route or accessibility condition.

### Before / After evidence contract

Before captures are taken from the same mock-authenticated route matrix before Issue #414 style
changes. After captures use the same route, role, viewport, browser, theme, and scroll conditions.
Each capture records the rendered commit SHA, viewport, `scrollWidth`, full-page `scrollHeight`,
and the visible state. The evidence set covers all 14 routes at `390×844`, `768×1024`, and
`1280×900`; protected `/team-management` is captured with a team-lead fixture and `/admin` with
an admin fixture. Representative screenshots are inspected at every breakpoint, with focused
interaction checks for auth, navigation, tables, filters, modals, forms, and feedback states.

## Issue #410 — 출석 운영 화면

### Information architecture

The `/attendance` route has two role-based surfaces under one information model.

- Member: `오늘 출석` → scheduled time and one clock action → status timeline → personal records → personal schedule settings.
- Team lead/admin: `출석 관리` → date/export controls → summary (`전체 기록`, `처리 필요`, `근무 중`, `퇴근 완료`) → member search/status filter → today records → selected record detail.
- Personal records and operational records remain separate so a member does not need to scan an operations table to clock in, while an operator can start with records needing attention.
- The detail panel is read-only in this issue. Reason, approval, settlement, notification, and audit actions are reserved as extension slots for #375–#378 without changing existing API contracts.

### User scenarios and status language

| Surface | Scenario | Primary action | Visible status language |
| --- | --- | --- | --- |
| Member | Before clock-in | `출근하기` | `출근 전` |
| Member | During work | `퇴근하기` | `근무 중` |
| Member | After clock-out | disabled completion state | `퇴근 완료` |
| Member/operator | Missing or exceptional record | future detail/recovery slot | `예외 확인 필요` |
| Operator | Review current records | select a record row | `처리 필요`, `근무 중`, `퇴근 완료` |

Status is always represented by text, layout, and an icon or border treatment. Color is an additional cue only.

### Component boundaries

- `Attendance`: route composition, role split, date loading, CSV export, and retry state.
- `MemberAttendanceView`: today CTA, schedule chip, status timeline, and personal history.
- `OperatorAttendanceBoard`: summary, search/status filtering, priority ordering, record selection, and read-only detail panel.
- `SetWorkDaysPersonal`: member-owned schedule controls with labelled day toggles and time inputs.
- `attendanceView.ts`: pure status, time, and summary mapping shared by the attendance views.

### Responsive, theme, and accessibility rules

- Desktop target: `1280px` wide content with a fixed `200px` shell and `32px` page padding.
- Narrow target: at `768px` and below, navigation becomes a fixed bottom bar and content receives bottom clearance. At `700px`/`480px`, operator rows and member timeline collapse without horizontal scrolling.
- Touch targets are at least `36px`; the member clock CTA is at least `44px` high.
- Dark mode uses the Octo Code layers in this document. Light mode is opt-in through the existing explicit `data-theme="light"` preference; the operating-system color scheme does not override the dark default.
- Every action is keyboard reachable, focus-visible, labelled, and has a text equivalent. Status timeline uses `aria-current`, record rows expose a member-specific accessible name, and the detail panel uses a labelled `aside`.
- Loading, API error, retry, empty, and filtered-empty states occupy the same record region. Authentication and permission routing remain owned by the existing route guards.
- Offline behavior is limited to visible failure and retry in this issue. Attendance schedule/session cache entries are scoped by authenticated user and cleared on logout; the server remains the source of truth.

### Implementation boundary and next stages

1. Completed in #410: Octo tokens, light-mode aliases, shell/navigation layering, role-based attendance IA, status language, responsive record/detail layout, and regression coverage.
2. Extension slot: #375 adds exception reason entry and approval/rejection actions to the existing detail panel.
3. Extension slot: #376 adds notification preferences and delivery states without changing the member CTA.
4. Extension slot: #377 adds settlement/report columns and CSV mapping to the operator record model.
5. Extension slot: #378 adds audit history to the detail panel.

Existing attendance endpoints remain the data source. Operator reads may send date/team filters, and the server must enforce the authenticated role and team claims; the mock handlers mirror those authorization boundaries for local verification.

## Before / After evidence — #410

All captures use `VITE_USE_MOCK=true`, the same `/attendance` route, dark color scheme, Chromium, and full-page screenshots. Baseline SHA is `b223bcd103c81aa3069efbff6bf096bd18419708`; the Before set was captured before implementation edits.

### Before

| Capture | Role | Viewport | Objective evidence | File |
| --- | --- | --- | --- | --- |
| Admin desktop | ADMIN | `1280×900` | `scrollWidth=1280`; operator table was empty because the fixture was fixed to `2026-03-22` while the page queried `2026-08-21`; purple glass cards and English labels dominated the hierarchy. | `.qa/issue-410/before/admin-1280.png` |
| Admin narrow | ADMIN | `768×1024` | `scrollWidth=768`, `scrollHeight=1238`; table and summary stacked into a long page. | `.qa/issue-410/before/admin-768.png` |
| Admin mobile | ADMIN | `390×844` | `scrollWidth=495` (horizontal overflow); fixed bottom navigation overlapped the content and the operator table was not usable as a mobile interaction. | `.qa/issue-410/before/admin-390.png` |
| Member mobile | MEMBER | `390×844` | `scrollWidth=396`; the schedule editor appeared before any today CTA/status model, and the bottom navigation visually collided with the content boundary. | `.qa/issue-410/before/member-390.png` |
| Member desktop | MEMBER | `1280×900` | `scrollWidth=1280`; the page showed the same schedule editor and history table but no single today action or status timeline. | `.qa/issue-410/before/member-1280.png` |

Before interaction findings:

- Admin could not see today mock records because the mock date and local date were disconnected.
- Member and operator views shared the same schedule-first layout, so the primary task was not role-specific.
- Purple gradients, blur, 10–20px functional radii, and 200ms transitions conflicted with the Octo Code tokens.
- Status labels were English (`Present`, `Working`) and status was primarily expressed through color badges.

### After

After captures were regenerated on `2026-08-22` against rendered implementation commit `4c8ec8f238a19c22ed95ac1201aa761bf16264f`, after the permission, race-safety, cache-isolation, touch-target, and date-range-label fixes. The captures use the same route, role, viewport, mock mode, and default scroll position as the Before set. Full-page image heights record the rendered scroll height; a second browser pass checked bottom clearance at the maximum scroll position. Each PNG carries a `capture-source-sha` metadata marker for the rendered implementation; later commits only update DESIGN/evidence metadata.

| Capture | Role | Viewport | Objective evidence | File |
| --- | --- | --- | --- | --- |
| Admin desktop | ADMIN | `1280×900` | `scrollWidth=1280`, full-page `scrollHeight=900`; 3 current records rendered, with 2 `근무 중` records ordered before the completed record. | `.qa/issue-410/after/admin-1280.png` |
| Admin narrow | ADMIN | `768×1024` | `scrollWidth=768`, full-page `scrollHeight=1034`; summary and record/detail regions remain in one readable column, with 59px clearance above fixed navigation at max scroll. | `.qa/issue-410/after/admin-768.png` |
| Admin mobile | ADMIN | `390×844` | `scrollWidth=390`, full-page `scrollHeight=1314`; no horizontal overflow, 2×2 summary grid, compact record rows, and 55px clearance above fixed navigation at max scroll. | `.qa/issue-410/after/admin-390.png` |
| Team lead mobile | TEAM_LEAD | `390×844` | `scrollWidth=390`, full-page `scrollHeight=1178`; only the team lead's `박팀장` record is rendered, with 63px clearance above fixed navigation at max scroll. | `.qa/issue-410/after/team-lead-390.png` |
| Member mobile | MEMBER | `390×844` | `scrollWidth=390`, full-page `scrollHeight=2241`; today status, one `퇴근하기` CTA, timeline, records, and schedule settings stack without horizontal overflow, with 63px clearance above fixed navigation at max scroll. | `.qa/issue-410/after/member-390.png` |
| Member desktop | MEMBER | `1280×900` | `scrollWidth=1280`, full-page `scrollHeight=1675`; today status and `08:30–17:30` schedule are first, followed by the text timeline, personal record, and settings sections. | `.qa/issue-410/after/member-1280.png` |

After interaction evidence:

- Admin search for `박` reduced the record list to `박팀장`; clearing the search restored all 3 records.
- Selecting `김리더 기록 상세 보기` opened a labelled detail panel with date, status, scheduled time, `09:02`, and `18:15`.
- Admin `이번 주` changed the management description to `이번 주의 출석 현황` and the record heading to the selected `YYYY-MM-DD ~ YYYY-MM-DD 기록` range.
- Member `퇴근하기` changed the timeline status copy to `퇴근 완료` and changed the CTA to disabled `오늘 출석 완료` after the mock API response.
- Team lead login rendered only the own-team `박팀장` record; admin retained the full three-record view.
- At maximum narrow/mobile scroll, the admin record region and member schedule section ended above the fixed navigation (`59px`, `55px`, `63px`, and `63px` for admin narrow, admin mobile, team-lead mobile, and member mobile respectively).

After verification checklist:

- [x] Same-role, same-viewport screenshots exist for every Before row, plus a team-lead scope capture.
- [x] `scrollWidth` is no greater than the viewport width at `390px`, `768px`, and `1280px`.
- [x] Admin records show current mock data, priority ordering, search filtering, and a selectable detail panel.
- [x] Member view shows one CTA, schedule chip, text timeline, personal records, and retry state.
- [x] Keyboard focus, text status, contrast, touch target size, and mobile bottom clearance are checked in the browser.
- [x] Fresh PNG signatures, dimensions, and final verification metadata were checked for all six After captures.

### Navigation active-state follow-up

The post-merge navigation polish was captured against source commit `fbf6ee2` after replacing the warning-yellow active rail/icon with the Octo primary blue token. The active item uses `rgba(47, 129, 247, 0.12)` as its surface tint, `#2F81F7` for the 2px left rail and icon, and keeps warning yellow reserved for caution states.

| Capture | Viewport | Objective evidence | File |
| --- | --- | --- | --- |
| Home sidebar | `1280×900` | Active `홈` uses primary blue rail/icon and `scrollWidth=1280`. | `.qa/issue-410/after/nav-active-blue-1280.png` |
| Home bottom navigation | `390×844` | Active `홈` uses primary blue rail/icon and `scrollWidth=390`; no horizontal overflow. | `.qa/issue-410/after/nav-active-blue-390.png` |

## Before / After evidence — #414

The app-wide baseline was captured from `develop` at `f35affdb5a30a9c05b25e9b22d92742b13abc1ef`
before Issue #414 style edits. The After set was captured on `2026-08-22` from rendered source
`753febc17546ca4bdd7c3525f53e43fc719f7de1`. Both sets use Chromium, `VITE_USE_MOCK=true`,
dark theme, full-page screenshots, and the same `390×844`, `768×1024`, and `1280×900` viewports.
The After set uses the admin fixture for authenticated general routes, the team-lead fixture for
`/team-management`, and no auth fixture for the public routes.

### Before

| Scope | Coverage | Objective evidence | File |
| --- | --- | --- | --- |
| Authenticated shell | 10 routes × 3 viewports | Existing shell and route CSS used mixed glass/gradient surfaces, large functional radii, and route-specific spacing. | `.qa/issue-414/before/metadata.json` |
| Public auth | 3 routes × 3 viewports | Login, register, and email verification shared the legacy decorative auth treatment. | `.qa/issue-414/before/login-desktop.png`, `.qa/issue-414/before/register-desktop.png`, `.qa/issue-414/before/verify-email-desktop.png` |
| Protected team management | 1 route × 3 viewports | Admin fixture redirected `/team-management` to `/`, so the team-lead surface had no valid baseline capture. | `.qa/issue-414/before/team-management-mobile.png` |
| Whole matrix | 42 captures | `scrollWidth` matched the viewport in the recorded baseline, but the evidence exposed route redirect coverage and inconsistent surface language. | `.qa/issue-414/before/metadata.json` |

### After

| Scope | Coverage | Objective evidence | File |
| --- | --- | --- | --- |
| Authenticated shell | 10 routes × 3 viewports | Sidebar active state is blue, surfaces use token borders and 6px functional radii, and mobile uses the fixed bottom bar with content clearance. | `.qa/issue-414/after/home-desktop.png`, `.qa/issue-414/after/home-mobile.png` |
| Chat, calendar, schedules | 3 routes × 3 viewports | Toolbars, selected rows, FullCalendar controls, message surfaces, and schedule legends use shared blue/info, warning, success, and error states. | `.qa/issue-414/after/chat-desktop.png`, `.qa/issue-414/after/calendar-desktop.png`, `.qa/issue-414/after/work-schedules-mobile.png` |
| Operations and data pages | 4 routes × 3 viewports | Attendance, members, team management, and admin tables use compact bordered rows, readable empty states, and semantic status colors. | `.qa/issue-414/after/attendance-desktop.png`, `.qa/issue-414/after/members-desktop.png`, `.qa/issue-414/after/team-management-desktop.png`, `.qa/issue-414/after/admin-mobile.png` |
| Drive and AI | 2 routes × 3 viewports | File lists, upload controls, AI messages, suggestions, and code-friendly surfaces no longer depend on purple gradients or blur. | `.qa/issue-414/after/drive-mobile.png`, `.qa/issue-414/after/ai-desktop.png` |
| My Page and public auth | 4 routes × 3 viewports | Settings sections, form controls, login, register, and email verification use the same surface and focus language. | `.qa/issue-414/after/my-page-mobile.png`, `.qa/issue-414/after/login-desktop.png`, `.qa/issue-414/after/register-desktop.png`, `.qa/issue-414/after/verify-email-mobile.png` |
| Whole matrix | 42 captures | All 14 requested routes rendered at the requested path; all 42 captures recorded `scrollWidth` equal to the viewport width. | `.qa/issue-414/after/metadata.json` |

After verification checklist:

- [x] All 14 routes render at `390px`, `768px`, and `1280px`.
- [x] `scrollWidth` does not exceed the viewport in any of the 42 After captures.
- [x] `/team-management` is captured with the team-lead fixture and no longer redirects to `/`.
- [x] Navigation selection uses primary blue; warning yellow remains reserved for caution/status.
- [x] Auth backgrounds, cards, fields, buttons, and public feedback states use the shared surface layer.
- [x] Explicit light theme was checked on home, calendar, and login at `1280×900`; all kept the viewport width.
- [x] Fresh PNG files, dimensions, route paths, roles, and scroll metrics are recorded in After metadata.
