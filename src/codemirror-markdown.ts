import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
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
import { EditorState, Annotation } from '@codemirror/state';
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
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { RemoteCursor } from './remote-cursor';

const DummyAnnotation = Annotation.define();

export class CodemirrorMarkdown extends ScopedElementsMixin(LitElement) {
  editor!: EditorView;

  @query('#editor')
  _editorEl!: HTMLElement;

  @property()
  set text(t: string) {
    if (this.editor) {
      this.setText(t);
    } else {
      this._text = t;
    }
  }

  @property()
  additionalCursors: Array<{ name: string; position: number; color: string }> =
    [];

  _text: string | undefined;

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
            !update.docChanged ||
            (update.transactions.length > 0 &&
              update.transactions[0].annotation(DummyAnnotation))
          ) {
            return;
          }

          let adj = 0;
          update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
            const insertText = insert.sliceString(0, insert.length, '\n');
            if (fromA !== toA) {
              const from = fromA + adj;
              const to = toA - fromA;
              setTimeout(() => {
                thisEl.dispatchEvent(
                  new CustomEvent('text-deleted', {
                    detail: {
                      from,
                      to,
                    },
                    bubbles: true,
                    composed: true,
                  })
                );
              });
            }
            if (insertText.length > 0) {
              const from = fromA + adj;
              setTimeout(() => {
                thisEl.dispatchEvent(
                  new CustomEvent('text-inserted', {
                    detail: {
                      from,
                      text: insertText,
                    },
                    bubbles: true,
                    composed: true,
                  })
                );
              });
            }
            adj += insertText.length - (toA - fromA);
          });
        }
      }
    );

    this.editor = new EditorView({
      state: EditorState.create({
        extensions: [
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
          plugin,
        ],
      }),
      parent: this._editorEl as Element,
    });
    if (this._text) {
      this.setText(this._text);
    }
    this.requestUpdate();
  }

  setText(t: string) {
    const { selection } = this.editor.state;
    this.editor.dispatch({
      annotations: [DummyAnnotation.of([])],
      changes: [
        {
          from: 0,
          to: this.editor.state.doc.length,
          insert: t,
        },
      ],
      selection: {
        anchor: selection.main.anchor,
      },
    });
  }

  renderCursors() {
    if (!this.editor) return html``;

    return this.additionalCursors.map(
      c =>
        html`<remote-cursor
          style=${styleMap({
            left: `${this.editor.coordsAtPos(c.position)?.left}px`,
            top: `${this.editor.coordsAtPos(c.position)?.top}px`,
          })}
          class="cursor"
          .name=${c.name}
          .color=${c.color}
        ></remote-cursor>`
    );
  }

  render() {
    return html`<div style="flex: 1;" id="editor"></div>
      ${this.renderCursors()} `;
  }

  static styles = css`
    :host {
      display: flex;
    }
    .cursor {
      position: fixed;
    }
  `;

  static get scopedElements() {
    return {
      'remote-cursor': RemoteCursor,
    };
  }
}
