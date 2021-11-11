import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { SlTooltip } from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

export class RemoteCursor extends ScopedElementsMixin(LitElement) {
  @property()
  name!: string;

  @property()
  color!: string;

  @state()
  _showCursor = true;

  firstUpdated() {
    setInterval(() => {
      this._showCursor = !this._showCursor;
    }, 600);
  }

  renderCursor() {
    return html`<div
      class="cursor"
      style=${styleMap({
        'background-color': `rgb(${this.color})`,
        opacity: this._showCursor ? '1' : '0',
      })}
    ></div>`;
  }

  render() {
    return html`
      ${this.name
        ? html`
            <sl-tooltip
              style=${styleMap({ '--sl-tooltip-background-color': this.color })}
              .open=${true}
              .content=${this.name}
            >
              ${this.renderCursor()}
            </sl-tooltip>
          `
        : this.renderCursor()}
    `;
  }

  static styles = css`
    .cursor {
      width: 1px;
      height: 18px;
      margin-left: -1;
    }
  `;

  static get scopedElements() {
    return {
      'sl-tooltip': SlTooltip,
    };
  }
}
