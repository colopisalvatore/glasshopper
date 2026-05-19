import { useState, type ReactNode } from 'react';

type Tab = 'tsx' | 'install' | 'panel';

const K = ({ children }: { children: ReactNode }) => <span className="k">{children}</span>;
const S = ({ children }: { children: ReactNode }) => <span className="s">{children}</span>;
const C = ({ children }: { children: ReactNode }) => <span className="c">{children}</span>;
const F = ({ children }: { children: ReactNode }) => <span className="f">{children}</span>;
const V = ({ children }: { children: ReactNode }) => <span className="v">{children}</span>;

function Line({ children, indent = 0 }: { children?: ReactNode; indent?: number }) {
  return (
    <span className="code-line">
      {'  '.repeat(indent)}
      {children}
      {'\n'}
    </span>
  );
}

const SNIPPETS: Record<Tab, { label: string; code: ReactNode }> = {
  tsx: {
    label: 'KitchenLight.tsx',
    code: (
      <>
        <Line>
          <C>{'// Five hooks. That’s the whole API.'}</C>
        </Line>
        <Line>
          <K>import</K> {'{ '}
          <F>useEntity</F>, <F>useService</F>
          {' }'} <K>from</K> <S>'@stoke/hooks'</S>;
        </Line>
        <Line />
        <Line>
          <K>function</K> <F>KitchenLight</F>() {'{'}
        </Line>
        <Line indent={1}>
          <K>const</K> light = <F>useEntity</F>(<S>'light.kitchen'</S>);
        </Line>
        <Line indent={1}>
          <K>const</K> turnOn = <F>useService</F>(<S>'light'</S>, <S>'turn_on'</S>);
        </Line>
        <Line />
        <Line indent={1}>
          <K>return</K> (
        </Line>
        <Line indent={2}>
          &lt;<V>button</V> onClick={'{'}() =&gt; <F>turnOn</F>({'{ '}entity_id: light.entity_id{' }'}){'}'}&gt;
        </Line>
        <Line indent={3}>{'{light?.state ?? …}'}</Line>
        <Line indent={2}>
          &lt;/<V>button</V>&gt;
        </Line>
        <Line indent={1}>);</Line>
        <Line>{'}'}</Line>
      </>
    ),
  },
  install: {
    label: 'Install',
    code: (
      <>
        <Line>
          <C>{'# Scaffold a new dashboard'}</C>
        </Line>
        <Line>
          <K>npx</K> create-stoke my-dashboard
        </Line>
        <Line />
        <Line>
          <C>{'# Develop against your live HA over the WebSocket'}</C>
        </Line>
        <Line>
          <K>cd</K> my-dashboard
        </Line>
        <Line>
          <K>npm</K> install
        </Line>
        <Line>
          <K>npm</K> run dev
        </Line>
        <Line />
        <Line>
          <C>{'# Build + ship to HA panel'}</C>
        </Line>
        <Line>
          <K>npm</K> run sync
        </Line>
      </>
    ),
  },
  panel: {
    label: 'configuration.yaml',
    code: (
      <>
        <Line>
          <C>{'# No YAML required — add the integration from the HA UI'}</C>
        </Line>
        <Line>
          <C>{'# Settings → Devices → + Add Integration → Stoke'}</C>
        </Line>
        <Line />
        <Line>
          <C>{'# Or install a template via service call:'}</C>
        </Line>
        <Line>
          <V>service</V>: stoke.<F>install_template</F>
        </Line>
        <Line>
          <V>data</V>:
        </Line>
        <Line indent={1}>
          url: <S>https://example.com/my-template.zip</S>
        </Line>
      </>
    ),
  },
};

export function CodeWindow() {
  const [tab, setTab] = useState<Tab>('tsx');
  const current = SNIPPETS[tab];

  return (
    <section className="code-window">
      <div className="code-window__chrome">
        <div className="code-window__dots">
          <span />
          <span />
          <span />
        </div>
        <div className="code-window__tabs">
          {(Object.keys(SNIPPETS) as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`code-window__tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {SNIPPETS[id].label}
            </button>
          ))}
        </div>
      </div>
      <pre className="code-window__body">
        <code>{current.code}</code>
      </pre>
    </section>
  );
}

