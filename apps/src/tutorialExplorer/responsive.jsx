/* A very simple responsive layout system.
 */

  /**
   * Gets the container width.
   * Returns either a number (e.g. 1170) or a string (e.g. "97%").
   */

function getResponsiveContainerWidth() {
  const windowWidth = $(window).width();

  if (windowWidth >= 1200) {
    return 1170;
  } else {
    return "97%";
  }
}

/**
 * From a set of values provided, returns the appropriate one for the current
 * window width.
 * Note that we default to the largest-provided value that is not for a width
 * that's greater than the current window width.  e.g. If the window width is
 * "md" then we use the provided "md" width, otherwise provided "sm" width,
 * otherwise provided "xs" width.
 * Note also that when the value being returned is a number, it's converted into
 * a percentage string.  e.g. 4 becomes "4%"
 *
 * @param {Object} values - A set of values from which we want one.
 * @param {number|string} values.xs - Value returned on extra-small layout.
 * @param {number|string} values.sm - Value returned on small layout.
 * @param {number|string} values.md - Value returned on medium layout.
 * @param {number|string} values.lg - Value returned on large layout.

 */

function getResponsiveValue(values) {
  const windowWidth = $(window).width();

  var value;
  if (windowWidth >= 1024) {
    if (values.lg) {
      value = values.lg;
    } else if (values.md) {
       value = values.md;
    } else if (values.sm) {
       value = values.sm;
    } else {
      value = values.xs;
    }
  } else if (windowWidth >= 820) {
    if (values.md) {
       value = values.md;
    } else if (values.sm) {
       value = values.sm;
    } else {
      value = values.xs;
    }
  } else if (windowWidth >= 650) {
    if (values.sm) {
       value = values.sm;
    } else {
      value = values.xs;
    }
  } else if (values.xs) {
    value = values.xs;
  }

  if (value) {
    if (typeof(value) === "number") {
      return `${value}%`;
    } else if (typeof(value) === "string") {
      return value;
    }
  }
}

export { getResponsiveContainerWidth, getResponsiveValue };
