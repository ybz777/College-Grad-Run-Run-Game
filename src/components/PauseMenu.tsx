import { Button, Panel } from './ui';

interface Props {
  onResume: () => void;
  onMenu: () => void;
}

export function PauseMenu({ onResume, onMenu }: Props) {
  return (
    <div className="overlay">
      <Panel>
        <p className="eyebrow">BREAK ROOM</p>
        <h2>PAUSED</h2>
        <p className="muted">The posting will still be “urgent” when you get back.</p>
        <div className="btn-col">
          <Button onClick={onResume}>RESUME</Button>
          <Button variant="ghost" onClick={onMenu}>
            MAIN MENU
          </Button>
        </div>
      </Panel>
    </div>
  );
}
