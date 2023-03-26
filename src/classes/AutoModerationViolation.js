module.exports = class AutoModerationViolation {
    constructor(AutoModerationRun, CheckName, TriggerName, TriggerValue, Punishment) {
        this.TobyBot = AutoModerationRun.TobyBot;
        this.AutoModerationRun = AutoModerationRun;

        this.checkName = CheckName;
        this.TriggerName = TriggerName;
        this.TriggerValue = TriggerValue;

        this.Weight = 0;

        this.Punishment = Punishment;
    }

    setCheckName(checkName) {
        this.checkName = checkName;
        return this;
    }

    setTriggerName(TriggerName) {
        this.TriggerName = TriggerName;
        return this;
    }

    setTriggerValue(TriggerValue) {
        this.TriggerValue = TriggerValue;
        return this;
    }

    setWeight(Weight) {
        this.Weight = Weight;
        return this;
    }
}