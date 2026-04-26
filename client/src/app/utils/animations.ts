import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from "@angular/animations";

export const slideInAnimation = trigger("routeAnimations", [
  // --- Slide Transition (Forward) ---
  transition(
    (from, to) => {
      const parts = to?.split(":");
      return parts?.[0] === "slide" && parts?.[1] !== "backward";
    },
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1,
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [style({ opacity: 0, transform: "translateX(100%)", zIndex: 2 })],
        {
          optional: true,
        },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              "350ms ease-in",
              style({ opacity: 0, transform: "translateX(-100%)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              "450ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "translateX(0)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ],
  ),

  // --- Slide Transition (Backward) ---
  transition(
    (from, to) => {
      const parts = to?.split(":");
      return parts?.[0] === "slide" && parts?.[1] === "backward";
    },
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1,
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [style({ opacity: 0, transform: "translateX(-100%)", zIndex: 2 })],
        {
          optional: true,
        },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              "350ms ease-in",
              style({ opacity: 0, transform: "translateX(100%)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              "450ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "translateX(0)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ],
  ),

  // --- Zoom Transition (Forward - Zoom In) ---
  transition(
    (from, to) => {
      const parts = to?.split(":");
      return parts?.[0] === "zoom" && parts?.[1] !== "backward";
    },
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            opacity: 0,
            transform: "scale(1.1) translateY(30px)",
            zIndex: 2,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              "400ms ease-out",
              style({ opacity: 0, transform: "scale(0.9) translateY(-20px)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              "500ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "scale(1) translateY(0)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ],
  ),

  // --- Zoom Transition (Backward - Zoom Out) ---
  transition(
    (from, to) => {
      const parts = to?.split(":");
      return parts?.[0] === "zoom" && parts?.[1] === "backward";
    },
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            opacity: 0,
            transform: "scale(0.9) translateY(-20px)",
            zIndex: 2,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              "400ms ease-out",
              style({ opacity: 0, transform: "scale(1.1) translateY(30px)" }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              "500ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "scale(1) translateY(0)" }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ],
  ),

  // --- Blur Transition ---
  transition(
    (from, to) => to?.split(":")?.[0] === "blur",
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [
          style({
            opacity: 0,
            filter: "blur(20px)",
            zIndex: 2,
          }),
        ],
        { optional: true },
      ),
      group([
        query(
          ":leave",
          [
            animate(
              "400ms ease-out",
              style({
                opacity: 0,
                filter: "blur(20px)",
              }),
            ),
          ],
          { optional: true },
        ),
        query(
          ":enter",
          [
            animate(
              "500ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({
                opacity: 1,
                filter: "blur(0)",
              }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ],
  ),

  // --- Fade Transition ---
  transition(
    (from, to) => to?.split(":")?.[0] === "fade",
    [
      style({ position: "relative" }),
      query(
        ":enter, :leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1,
          }),
        ],
        { optional: true },
      ),
      query(
        ":enter",
        [style({ opacity: 0, transform: "scale(0.98)", zIndex: 2 })],
        { optional: true },
      ),
      group([
        query(":leave", [animate("250ms ease-out", style({ opacity: 0 }))], {
          optional: true,
        }),
        query(
          ":enter",
          [
            animate(
              "350ms ease-out",
              style({ opacity: 1, transform: "scale(1)" }),
            ),
          ],
          {
            optional: true,
          },
        ),
      ]),
    ],
  ),

  // Backward compatibility / Fallback
  transition("* <=> *", [
    style({ position: "relative" }),
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1,
        }),
      ],
      { optional: true },
    ),
    query(":enter", [style({ opacity: 0, zIndex: 2 })], { optional: true }),
    group([
      query(":leave", [animate("200ms ease-out", style({ opacity: 0 }))], {
        optional: true,
      }),
      query(":enter", [animate("300ms ease-out", style({ opacity: 1 }))], {
        optional: true,
      }),
    ]),
  ]),
]);
