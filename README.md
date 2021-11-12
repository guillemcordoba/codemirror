# @scoped-elements/codemirror

This is a wrapper of [codemirror](https://codemirror.net/6/) packaged using the scoped custom elements registries pattern using [@open-wc/scoped-elements](https://www.npmjs.com/package/@open-wc/scoped-elements).

## Installation

```bash
npm i @scoped-elements/codemirror
```

## Usage

### As an sub element in your own custom element

```js
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

export class CustomElement extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'codemirror-markdown': CodemirrorMarkdown,
    };
  }

  render() {
    return html`
      <codemirror-markdown
        text="example text"
        @text-inserted=${e => {
          console.log(e);
        }}
      ></codemirror-markdown>
    `;
  }
}
```

### As a globally defined custom element

```js
import { CodemirrorMarkdown } from '@scoped-elements/codemirror';

customElements.define('codemirror-markdown', CodemirrorMarkdown);
```

## Documentation for the elements

As this package is just a re-export, you can find the documentation for codemirror [here](https://codemirror.net/6/).

## Appreciation

This library is just a re-export, all the credit goes to [codemirror](https://codemirror.net/6/) and its authors. Thanks!
