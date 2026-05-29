// ============================================================
//  KidBrainBreak — Question Renderer / Factory
// ============================================================

import {
  MultipleChoice, TrueFalse, FillInTheBlanks, ConnectTerms,
  OrganizeTags, WordScramble, OddOneOut, CategorizeItems,
  SequenceOrder, SpellItOut, ShortAnswer, IpaTranscription
} from '../components/question-types/QuestionTypes.js';
import { IpaKeyboard } from '../components/IpaKeyboard.js';

/**
 * Renders a question into `container` and returns a { validate } object.
 * `onReady(bool)` is called whenever the answer readiness changes.
 */
export function renderQuestion(container, question, onReady) {
  container.innerHTML = '';

  switch (question.type) {
    case 'multiple_choice':
      return new MultipleChoice(container, question, onReady);

    case 'true_false':
      return new TrueFalse(container, question, onReady);

    case 'fill_in_the_blank':
      return new FillInTheBlanks(container, question, onReady);

    case 'connect_terms':
      return new ConnectTerms(container, question, onReady);

    case 'organize_tags':
      return new OrganizeTags(container, question, onReady);

    case 'word_scramble':
      return new WordScramble(container, question, onReady);

    case 'odd_one_out':
      return new OddOneOut(container, question, onReady);

    case 'categorize_items':
      return new CategorizeItems(container, question, onReady);

    case 'sequence_order':
      return new SequenceOrder(container, question, onReady);

    case 'spell_it_out':
      return new SpellItOut(container, question, onReady);

    case 'short_answer':
      return new ShortAnswer(container, question, onReady);

    case 'ipa_transcription':
      return new IpaTranscription(container, question, onReady, IpaKeyboard);

    default:
      container.innerHTML = `<p style="color:#ff5252">⚠️ Unknown question type: <code>${question.type}</code></p>`;
      return { validate: () => false };
  }
}
