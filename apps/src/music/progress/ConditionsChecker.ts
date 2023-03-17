// A small helper class that accumulates satisfied conditions, and then evaluates
// whether a set of conditions have all been satisfied.  Unknown conditions are
// skipped.  The accumulated satisfied conditions can be cleared at any time.

export default class ConditionsChecker {
  private currentSatisfiedConditions: {[key: string]: boolean};
  private knownConditions: Object;

  constructor(knownConditions: Object) {
    this.currentSatisfiedConditions = {};
    this.knownConditions = knownConditions;
  }

  // Reset the accumulated conditions.
  clear() {
    this.currentSatisfiedConditions = {};
  }

  // Accumulate a satisfied condition.
  addSatisfiedCondition(id: string, value: boolean) {
    this.currentSatisfiedConditions[id] = value;
  }

  // Check whether the current set of satisfied conditions satisfy the given
  // required conditions.
  checkRequirementConditions(requiredConditions: [string]) {
    for (const requiredCondition of requiredConditions) {
      // If we don't yet support a condition, don't check against it for now.
      if (!Object.values(this.knownConditions).includes(requiredCondition)) {
        continue;
      }

      // Not satisfying a required condition is a fail.
      if (!this.currentSatisfiedConditions[requiredCondition]) {
        return false;
      }
    }

    // All conditions are satisfied.
    return true;
  }
}
