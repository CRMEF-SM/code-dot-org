import React, {Component, PropTypes} from 'react';
import i18n from "@cdo/locale";
import Button from "../Button";
import ValidationStep, {Status} from '@cdo/apps/lib/ui/ValidationStep';

const styles = {
  unit6Form: {
    marginTop: 15
  },
  question: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  radio: {
    margin: '0px 10px'
  },
  submit: {
    marginTop: 5
  }
};

export default class Unit6ValidationStep extends Component {
  static propTypes = {
    previousStepsSucceeded: PropTypes.bool.isRequired,
    stepStatus: PropTypes.oneOf(Object.values(Status)).isRequired,
    initialChoice: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      choice: props.initialChoice,
      submitting: false,
    };
  }

  handleChangeIntention = event => {
    this.setState({choice: event.target.value});
  }

  handleSubmit = () => {
    this.setState({submitting: true});
    $.ajax({
     url: "/maker/apply",
     type: "post",
     dataType: "json",
     data: {
       unit_6_intention: this.state.choice
     }
   }).done(data => {
     this.props.onSubmit(data.eligible);
     this.setState({submitting: false});
   }).fail((jqXHR, textStatus) => {
     // TODO: should probably introduce some error UI
     console.error(textStatus);
   });
  }

  render() {
    const { previousStepsSucceeded, stepStatus } = this.props;
    return (
      <ValidationStep
        stepName={i18n.eligibilityReqYear()}
        stepStatus={stepStatus}
        alwaysShowChildren={true}
      >
        {previousStepsSucceeded &&
          <div>
            {i18n.eligibilityReqYearFail()}
            <form style={styles.unit6Form}>
              <div style={styles.question}>
                {i18n.eligibilityReqYearConfirmInstructions()}
              </div>
              {[
                ['no', i18n.eligibilityYearNo()],
                ['yes1718', i18n.eligibilityYearYes1718()],
                ['yes1819', i18n.eligibilityYearYes1819()],
                ['yesAfter', i18n.eligibilityYearAfter()],
                ['unsure', i18n.eligibilityYearUnknown()],
              ].map(([value, description]) =>
                <label key={value}>
                  <input
                    style={styles.radio}
                    type="radio"
                    name="year"
                    value={value}
                    checked={this.state.choice === value}
                    onChange={this.handleChangeIntention}
                    disabled={stepStatus !== Status.UNKNOWN}
                  />
                {description}
                </label>
              )}
              {/* Remove button after choice is made */}
              {stepStatus === Status.UNKNOWN &&
                <Button
                  style={styles.submit}
                  color={Button.ButtonColor.orange}
                  text={this.state.submitting ? i18n.submitting() : i18n.submit()}
                  onClick={this.handleSubmit}
                  disabled={this.state.submitting}
                />
              }
            </form>
          </div>
        }
        {stepStatus === Status.FAILED &&
          <div>{i18n.eligibilityYearDecline()}</div>
        }
      </ValidationStep>
    );
  }
}
