import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EditorView,
  ViewUpdate,
  ViewPlugin,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
} from '@codemirror/view';
import {
  SelectionRange,
  EditorState,
  Annotation,
  TransactionSpec,
} from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

import { foldGutter, foldKeymap } from '@codemirror/fold';
import { indentOnInput } from '@codemirror/language';
import { lineNumbers, highlightActiveLineGutter } from '@codemirror/gutter';
import { defaultKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { rectangularSelection } from '@codemirror/rectangular-selection';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { lintKeymap } from '@codemirror/lint';
import { oneDarkTheme } from '@codemirror/theme-one-dark';

import isEqual from 'lodash-es/isEqual';

import './remote-cursor';

const DummyAnnotation = Annotation.define();

export interface CodemirrorState {
  text: string;
  selection?: SelectionRange;
}

@customElement('codemirror-markdown')
export class CodemirrorMarkdown extends LitElement {
  editor!: EditorView;

  @query('#editor')
  _editorEl!: HTMLElement;

  _state: CodemirrorState | undefined;

  @property()
  set state(s: CodemirrorState) {
    if (this.editor && !isEqual(this._state, s)) {
      this.setState(s);
    }
    this._state = s;
  }

  @property()
  additionalCursors: Array<{ name: string; position: number; color: string }> =
    [];

  firstUpdated() {
    const thisEl = this;

    const plugin = ViewPlugin.fromClass(
      class {
        a: any;

        constructor() {
          this.a = {};
        }

        update(update: ViewUpdate) {
          if (
            update.transactions.length > 0 &&
            update.transactions[0].annotation(DummyAnnotation)
          ) {
            return;
          }

          if (update.selectionSet && !update.docChanged) {
            const rangesDeep: SelectionRange[][] = update.transactions
              .map(t => t.selection?.ranges)
              .filter(t => t) as SelectionRange[][];
            const ranges: SelectionRange[] = ([] as SelectionRange[]).concat(
              ...rangesDeep
            );

            thisEl.dispatchEvent(
              new CustomEvent('selection-changed', {
                bubbles: true,
                composed: true,
                detail: { ranges },
              })
            );
          }

          if (!update.docChanged) return;

          let adj = 0;
          update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
            const insertText = insert.sliceString(0, insert.length, '\n');
            if (fromA !== toA) {
              const from = fromA + adj;
              const characterCount = toA - fromA;

              setTimeout(() => {
                const coords = thisEl.editor.coordsAtPos(from);

                thisEl.dispatchEvent(
                  new CustomEvent('text-deleted', {
                    detail: {
                      from,
                      characterCount,
                      coords,
                    },
                    bubbles: true,
                    composed: true,
                  })
                );
              }, 1);
            }
            if (insertText.length > 0) {
              const from = fromA + adj;
              setTimeout(() => {
                const coords = thisEl.editor.coordsAtPos(
                  from + insertText.length
                );
                thisEl.dispatchEvent(
                  new CustomEvent('text-inserted', {
                    detail: {
                      from,
                      text: insertText,
                      coords,
                    },
                    bubbles: true,
                    composed: true,
                  })
                );
              }, 1);
            }
            adj += insertText.length - (toA - fromA);
          });
        }
      }
    );

    this.editor = new EditorView({
      state: EditorState.create({
        extensions: [
          EditorView.lineWrapping,
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          foldGutter(),
          drawSelection(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          defaultHighlightStyle.fallback,
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          rectangularSelection(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
          ]),
          markdown(),
          oneDarkTheme,
          plugin,
        ],
      }),
      parent: this._editorEl as Element,
    });
    if (this._state) {
      this.setState(this._state);
    }
    this.requestUpdate();
  }

  setState(state: CodemirrorState) {
    const transaction: TransactionSpec = {
      annotations: [DummyAnnotation.of([])],
    };
    const documentLength = this.editor.state.doc.length;
    transaction.changes = [
      {
        from: 0,
        to: documentLength,
        insert: state.text,
      },
    ];
    if (state.selection) {
      transaction.selection = {
        anchor: state.selection.from,
        head: state.selection.to,
      };
    }

    this.editor.dispatch(transaction);
  }

  dispatchChanges(changes: TransactionSpec) {
    this.editor.dispatch({
      annotations: [DummyAnnotation.of([])],
      ...changes,
    });
  }

  renderCursor(c: { position: number; name: string; color: string }) {
    if (!this.editor) return html``;

    if (this.editor.state.doc.length < c.position) return html``;

    const coords = this.editor.coordsAtPos(c.position);

    if (!coords) return html``;

    return html`<codemirror-remote-cursor
      style=${styleMap({
        left: `${coords.left}px`,
        top: `${coords.top}px`,
      })}
      class="cursor"
      .name=${c.name}
      .color=${c.color}
    ></codemirror-remote-cursor>`;
  }

  render() {
    return html`<div style="flex: 1;" id="editor"></div>
      ${this.additionalCursors.map(c => this.renderCursor(c))} `;
  }

  static styles = css`
    :host {
      display: flex;
    }
    .cursor {
      position: fixed;
    }
  `;
}
