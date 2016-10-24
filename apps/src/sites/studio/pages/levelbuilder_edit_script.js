/** @file JavaScript run only on the /s/:script_name/edit page. */
/* globals scriptData, i18nData, levelKeyList */

import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import VirtualizedSelect from 'react-virtualized-select';
import 'react-virtualized/styles.css';
import 'react-select/dist/react-select.css';
import 'react-virtualized-select/styles.css';
import _ from 'lodash';
import color from '../../../color';

const borderRadius = 3;

const styles = {
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '4px 6px',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: 4
  },
  checkbox: {
    margin: '0 0 0 7px'
  },
  groupHeader: {
    fontSize: 18,
    color: 'white',
    background: color.cyan,
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    padding: 10
  },
  groupBody: {
    background: color.lightest_cyan,
    borderBottomLeftRadius: borderRadius,
    borderBottomRightRadius: borderRadius,
    padding: 10,
    marginBottom: 20
  },
  stageCard: {
    fontSize: 18,
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: borderRadius,
    padding: 20,
    margin: 10
  },
  stageCardHeader: {
    color: '#5b6770',
    marginBottom: 15
  },
  levelTokenActive: {
    padding: 7,
    outline: '#3b99fc auto',
    outlineOffset: '-2px'
  },
  levelToken: {
    fontSize: 12,
    background: '#eee',
    boxShadow: 'inset 0 2px 0 0 rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius,
    margin: '5px 0',
    ':focus': {
      outline: 0
    }
  },
  controls: {
    float: 'right'
  },
  controlIcon: {
    margin: '0 5px'
  },
  levelSelect: {
    marginBottom: 5
  },
  levelTypeLabel: {
    float: 'left',
    lineHeight: '36px',
    marginLeft: 5
  },
  levelTypeSelect: {
    width: 'calc(100% - 80px)',
    marginLeft: 80
  },
  reorder: {
    fontSize: 16,
    display: 'table-cell',
    background: '#ddd',
    border: '1px solid #bbb',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
    padding: '7px 15px',
    borderTopLeftRadius: borderRadius,
    borderBottomLeftRadius: borderRadius
  },
  remove: {
    fontSize: 14,
    display: 'table-cell',
    color: 'white',
    background: '#c00',
    border: '1px solid #a00',
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
    padding: '7px 13px',
    borderTopRightRadius: borderRadius,
    borderBottomRightRadius: borderRadius
  },
  levelTokenName: {
    padding: 7,
    display: 'table-cell',
    width: '100%',
    borderTop: '1px solid #ddd',
    borderBottom: '1px solid #ddd'
  }
};

const ArrowRenderer = ({onMouseDown}) => <i className="fa fa-chevron-down" onMouseDown={onMouseDown}/>;
ArrowRenderer.propTypes = {onMouseDown: React.PropTypes.func.isRequried};

/**
 * Component for editing course scripts.
 */
const ScriptEditor = React.createClass({
  propTypes: {
    scriptData: React.PropTypes.object.isRequired,
    i18nData: React.PropTypes.object.isRequired
  },

  render() {
    return (
      <div>
        <h2>I18n Strings</h2>
        <label>
          Title
          <input
            name="title"
            defaultValue={this.props.i18nData.title}
            style={styles.input}
          />
        </label>
        <label>
          Audience
          <input
            name="description_audience"
            defaultValue={this.props.i18nData.descriptionAudience}
            style={styles.input}
          />
        </label>
        <label>
          Short Description
          <input
            name="description_short"
            defaultValue={this.props.i18nData.descriptionShort}
            style={styles.input}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={this.props.i18nData.description}
            rows={5}
            style={styles.input}
          />
        </label>
        <h2>Basic Settings</h2>
        <label>
          Visible in Teacher Dashboard
          <input
            name="visible_to_teachers"
            type="checkbox"
            defaultChecked={!this.props.scriptData.hidden}
            style={styles.checkbox}
          />
          <p>If checked this script will show up in the dropdown on the Teacher Dashboard, for teachers to assign to students.</p>
        </label>
        <label>
          Login Required
          <input
            name="login_required"
            type="checkbox"
            defaultChecked={this.props.scriptData.loginRequired}
            style={styles.checkbox}
          />
          <p>Require users to log in before viewing this script. This should be enabled on scripts that contain App Lab or Game Lab levels.</p>
        </label>
        <label>
          Hideable Stages
          <input
            name="hideable_stages"
            type="checkbox"
            defaultChecked={this.props.scriptData.hideable_stages}
            style={styles.checkbox}
          />
          <p>Allow teachers to toggle whether or not specific stages in this script are visible to students in their section.</p>
        </label>
        <label>
          Professional Learning Course
          <input
            name="professional_learning_course"
            defaultValue={this.props.scriptData.professionalLearningCourse}
            style={styles.input}
          />
        </label>
        <label>
          Peer Reviews to Complete
          <input
            name="peer_reviews_to_complete"
            defaultValue={this.props.scriptData.peerReviewsRequired}
            style={styles.input}
          />
        </label>
        <label>
          Wrap-up Video
          <input
            name="wrapup_video"
            defaultValue={this.props.scriptData.wrapupVideo}
            style={styles.input}
          />
        </label>
        <h2>Stages and Levels</h2>
        <FlexGroupEditor stages={this.props.scriptData.stages} />
      </div>
    );
  }
});

const FlexGroupEditor = React.createClass({
  propTypes: {
    stages: React.PropTypes.array.isRequired
  },

  render() {
    const nonPeerReviewStages = this.props.stages.filter(stage => stage.id);
    const groups = _.groupBy(nonPeerReviewStages, stage => (stage.flex_category || 'Default'));
    let count = 1;

    return (
      <div>
        {_.map(groups, (stages, group) => {
          return (
            <div key={group}>
              <div style={styles.groupHeader}>
                Group {count++}: {group}
                <Controls />
              </div>
              <div style={styles.groupBody}>
                {stages.map(stage => <StageEditor key={stage.id} stage={stage} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
});

const StageEditor = React.createClass({
  propTypes: {
    stage: React.PropTypes.object.isRequired
  },

  render() {
    return (
      <div style={styles.stageCard}>
        <div style={styles.stageCardHeader}>
          Stage {this.props.stage.position}: {this.props.stage.name}
          <Controls />
        </div>
        {this.props.stage.levels.map(level => <LevelEditor key={level.position} level={level} />)}
      </div>
    );
  }
});

const LevelEditor = Radium(React.createClass({
  propTypes: {
    level: React.PropTypes.object.isRequired
  },

  getInitialState() {
    return {};
  },

  handleClick() {
    this.setState({expanded: true});
  },

  handleLevelSelected(value) {
    console.log(value);
  },

  render() {
    return (
      <div style={[this.state.expanded && styles.levelTokenActive, styles.levelToken]} onClick={this.handleClick}>
        {this.state.expanded ?
          <div>
            {this.props.level.ids.map(id => {
              return (
                <VirtualizedSelect
                  key={id}
                  options={levelKeyList}
                  value={id}
                  onChange={this.handleLevelSelected}
                  clearable={false}
                  arrowRenderer={ArrowRenderer}
                  style={styles.levelSelect}
                />
              );
            })}
            <span style={styles.levelTypeLabel}>Level type:</span>
            <VirtualizedSelect
              value={this.props.level.kind}
              options={[{
                label: 'Puzzle', value: 'puzzle'
              }, {
                label: 'Assessment', value: 'assessment'
              }, {
                label: 'Named Level', value: 'named_level'
              }, {
                label: 'Unplugged', value: 'unplugged'
              }]}
              clearable={false}
              arrowRenderer={ArrowRenderer}
              style={styles.levelTypeSelect}
            />
          </div> :
          <div>
            <div style={styles.reorder}>
              <i className="fa fa-arrows-v" />
            </div>
            <span style={styles.levelTokenName}>
              {this.props.level.key}
              {this.props.level.ids.length > 1 && ` (${this.props.level.ids.length} variants...)`}
            </span>
            <div style={styles.remove}>
              <i className="fa fa-times" />
            </div>
          </div>
        }
      </div>
    );
  }
}));

const Controls = React.createClass({
  render() {
    return (
      <div style={styles.controls}>
        <i style={styles.controlIcon} className="fa fa-caret-up" />
        <i style={styles.controlIcon} className="fa fa-caret-down" />
        <i style={styles.controlIcon} className="fa fa-trash" />
      </div>
    );
  }
});

ReactDOM.render(
  <ScriptEditor scriptData={scriptData} i18nData={i18nData} />,
  document.querySelector('.edit_container')
);
