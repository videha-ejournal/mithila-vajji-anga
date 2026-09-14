export {};

declare global {
  // Browser Elements implement ParentNode (querySelector/querySelectorAll and child traversal).
  // The Vinext/worker type environment currently omits that DOM inheritance edge.
  interface Element extends ParentNode {}
}
