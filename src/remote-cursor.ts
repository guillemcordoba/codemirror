import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

@customElement('codemirror-remote-cursor')
export class RemoteCursor extends LitElement {
  @property()
  name!: string;

  @property()
  color!: string;

  renderCursor() {
    return html`<div
      class="cursor"
      style=${styleMap({
        'background-color': `rgb(${this.color})`,
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
              trigger="manual"
              placement="top"
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
}
