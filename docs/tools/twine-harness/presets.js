// presets.js — canned Twee 3 samples bound to the format-preset dropdown.
//
// Each preset declares its own format in StoryData so it works without
// the user touching the format dropdown. The IFIDs are random v4 UUIDs
// (RFC 4122-compatible) and have no significance beyond satisfying
// tweego's validator.

export const presets = {
  'hello-sugarcube': `:: StoryData
{
  "ifid": "11111111-2222-4333-8444-555566667777",
  "format": "SugarCube",
  "format-version": "2.30.0",
  "start": "Start"
}

:: StoryTitle
Hello SugarCube

:: Start
You stand in a small clearing. A path heads [[north]] and another heads [[south]].

:: north
The path slopes upward into pine forest. The air smells of needles.

[[Back to start|Start]]

:: south
You wade into a salt marsh. Birds wheel overhead.

[[Back to start|Start]]
`,

  'hello-harlowe': `:: StoryData
{
  "ifid": "22222222-3333-4444-8555-666677778888",
  "format": "Harlowe",
  "format-version": "3.1.0",
  "start": "Start"
}

:: StoryTitle
Hello Harlowe

:: Start
A foggy harbour at dawn.

[[Walk the pier->pier]]
[[Climb the lighthouse->lighthouse]]

:: pier
Wood creaks under your boots.

(link:"Look back")[(go-to:"Start")]

:: lighthouse
The keeper hasn't been here in years.

(link:"Climb down")[(go-to:"Start")]
`,

  'hello-snowman': `:: StoryData
{
  "ifid": "33333333-4444-4555-8666-777788889999",
  "format": "Snowman",
  "format-version": "2.0.2",
  "start": "Start"
}

:: StoryTitle
Hello Snowman

:: Start
Snowman uses raw HTML and underscore templates.

You are at <%= s.where || 'home' %>.

[[Set out|set-out]]

:: set-out
<% s.where = 'the road' %>
The road stretches on.

[[Go back home|Start]]
`,

  'hello-chapbook': `:: StoryData
{
  "ifid": "44444444-5555-4666-8777-888899990000",
  "format": "Chapbook",
  "format-version": "1.0.0",
  "start": "Start"
}

:: StoryTitle
Hello Chapbook

:: Start
visitedAt: now()
--
You wake in a quiet inn.

It's [visitedAt].

> [[Open the window]]
> [[Walk downstairs]]

:: Open the window
Cool morning air drifts in.

> [[Back|Start]]

:: Walk downstairs
The innkeeper waves.

> [[Back|Start]]
`,
};
