# jquery.touch: Touch gestures for jQuery

Adds a bunch of touch gestures and drag/drop events to jQuery. Supports simultaneous touch/mouse support and event delegation.

Requires jQuery 1.9+. Tested on Android (latest), iOS (latest), Firefox, Chrome, Safari, Edge, and IE11.

## Usage

Load it after jQuery:

```html
<script src="http://code.jquery.com/jquery-x.x.x.min.js"></script>
<script src="jquery.touch.min.js"></script>
```

Use `touch()` to enable touch gesture events:

```js
var e = $('#element');

e.touch();
```

Then simply bind to whatever events you'd like to use:

```js
e
  .on('tap', function(event) {
    alert('Tapped!');
  })
  .on('doubleTap', function(event) {
    alert('Double tapped!');
  })
  .on('swipeLeft', function(event) {
    alert('Swiped left!');
  });
```

You can also **delegate** events to descendant elements using the `delegateSelector` option:

```js

var e = $('#element');

e.touch({
  delegateSelector: '.foo, .bar'
});

e
  .on('tap', function(event) {
    alert('Tapped!');
  })
  .on('tap', '.foo', function(event) {
    event.stopPropagation();
    alert('Tapped on a "foo" element!');
  })
  .on('doubleTap', '.foo', function(event) {
    alert('Double tapped on a "foo" element!');
  })
  .on('swipeLeft', '.bar', function(event) {
    alert('Swiped left on a "bar" element!');
  });
```

And that's pretty much it.

## Supported Gesture Events

- `tap`
- `doubleTap`
- `tapAndHold`
- `dragStart`
- `drag`
- `dragEnd`
- `dragEnter`
- `dragOver`
- `dragLeave`
- `drop`
- `swipe`
- `swipeUp`
- `swipeDown`
- `swipeLeft`
- `swipeRight`

## Config

`touch()` can optionally take a config to override some or all of the following defaults:

```js
e.touch({

  // If true, touch inputs will trigger touch events.
    useTouch: true,

  // If true, mouse inputs will trigger touch events.
    useMouse: true,

  // If true, certain events (like drag) can continue to track even if the
  // mouse cursor leaves the originating element.
    trackDocument: false,

  // If true, when "trackDocument" is enabled, coordinates will be normalized
  // to the confines of the originating element.
    trackDocumentNormalize: false,

  // Disables "click" event (prevents both "tap" and "click" firing on certain
  // elements like <label>).
    noClick: false,

  // Distance from tap to register a drag (lower = more sensitive, higher =
  // less sensitive).
    dragThreshold: 10,

  // Time to wait before registering a drag (needs to be high enough to not
  // interfere with scrolling).
    dragDelay: 200,

  // Distance from tap to register a swipe (lower = more sensitive, higher
  // = less sensitive).
    swipeThreshold: 30,

  // Delay between taps.
    tapDelay: 250,

  // Time to wait before triggering "tapAndHold".
    tapAndHoldDelay: 500,

  // If defined, delegates touch events to descendants matching this selector.
    delegateSelector: null,

  // Filters drop target elements. Can be any of the following:
  // - "selector"                          Target element must match this
  //                                       selector.
  // - function(element, target) { ... }   Use boolean return value of a custom
  //                                       callback.
  // - true                                Target element must be a sibling of
  //                                       dragged element.
  // - false                               No filtering.
    dropFilter: false,

  // If true, traverses through parents for a match when dropFilter is a selector
  // or function.
    dropFilterTraversal: true,

  // Coordinate point of reference (page, screen, client).
    coordinates: 'page',

  // Prevent or allow default actions for certain event classes. Can be any of
  // the following:
  // - true                                Prevent default actions for this
  //                                       event class.
  // - false                               Allow default actions for this event
  //                                       class.
  // - function(state) { ... }             Use boolean return value of a custom
  //                                       callback (state = touch state object)
    preventDefault: {
      drag: false,
      swipe: false,
      tap: false
    }

});
```
## Gesture Data

Almost every event passes back an object with data on the triggering gesture. For example:

```js
e
  .on('tap', function(e, info) {
    alert('Tapped at ' + info.x + ', ' + info.y + '!');
  });
```

And here's what you'll find in that object for each event:

### `tap`, `doubleTap`, `tapAndHold`

- `x`: X position (relative to document)
- `y`: Y position  (relative to document)
- `ex`: X position (relative to element)
- `ey`: Y position (relative to element)
- `duration`: duration of tap (in ms)
- `event`: Original event

### `dragStart`

- `x`: X position (relative to document)
- `y`: Y position  (relative to document)
- `ex`: X position (relative to element)
- `ey`: Y position (relative to element)
- `event`: Original event

### `drag`

- `x`: X position (relative to document)
- `y`: Y position  (relative to document)
- `ex`: X position (relative to element)
- `ey`: Y position (relative to element)
- `start`: `x`/`y`/`ex`/`ey` of starting point
- `exStart`: (deprecated) X position of starting point (relative to element)
- `eyStart`: (deprecated) Y position of starting point (relative to element)
- `event`: Original event

### `dragEnd`

- `start`: `x`/`y`/`ex`/`ey` of starting point
- `end`: `x`/`y`/`ex`/`ey` of end point
- `distance`: Distance dragged (in pixels)
- `duration`: Time spent dragging (in ms)
- `velocity`: Dragging velocity (in pixels/ms)
- `event`: Original event

### `dragEnter`

- `element`: Element entered
- `event`: Original event

### `dragOver`

- `element`: Element dragged over
- `x`: X position (relative to document)
- `y`: Y position  (relative to document)
- `ex`: X position (relative to element)
- `ey`: Y position (relative to element)
- `event`: Original event

### `dragLeave`

- `element`: Element left
- `event`: Original event

### `drop`

- `element`: Element dropped on
- `x`: X position (relative to document)
- `y`: Y position  (relative to document)
- `ex`: X position (relative to element)
- `ey`: Y position (relative to element)
- `event`: Original event

### `swipe`, `swipeUp`, `swipeDown`, `swipeLeft`, `swipeRight`

- `distance`: Distance swiped (in pixels)
- `duration`: Time spent swiping (in ms)
- `velocity`: Swiping velocity (in pixels/ms)
- `event`: Original event

## License

jquery.touch is released under the MIT license.

Copyright © 2017 @ajlkn

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
