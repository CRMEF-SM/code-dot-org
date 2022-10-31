import {playSample, playSound, sample} from './blocks/samples';
import {forLoop} from './blocks/control';
import {triggeredAt, whenRun} from './blocks/events';

// All blocks
const blockList = [
  whenRun,
  triggeredAt,
  playSound,
  playSample,
  sample,
  forLoop
];

const MUSIC_BLOCKS = {};

// Construct mapping of BlockType -> block data
for (let block of blockList) {
  MUSIC_BLOCKS[block.definition.type] = block;
}

export {MUSIC_BLOCKS};
