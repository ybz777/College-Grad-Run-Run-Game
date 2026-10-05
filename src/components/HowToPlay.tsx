import { Button, Panel } from './ui';

interface Props {
  onBack: () => void;
}

export function HowToPlay({ onBack }: Props) {
  return (
    <div className="menu-shell">
      <Panel wide>
        <p className="eyebrow">ONBOARDING THAT GOES NOWHERE</p>
        <h2>HOW TO PLAY</h2>
        <div className="how-grid">
          <section>
            <h3>Objective</h3>
            <p>You are a recent graduate. The city is a job board with teeth. Survive as long as possible.</p>
          </section>
          <section>
            <h3>Keyboard</h3>
            <ul>
              <li>
                <b>A / Left</b> — change lane left
              </li>
              <li>
                <b>D / Right</b> — change lane right
              </li>
              <li>
                <b>W / Up / Space</b> — jump
              </li>
              <li>
                <b>S / Down</b> — slide
              </li>
              <li>
                <b>Escape</b> — pause
              </li>
            </ul>
          </section>
          <section>
            <h3>Touch</h3>
            <p>Swipe on the game, or use the on-screen pads: left, right, jump, slide.</p>
          </section>
          <section>
            <h3>Hazards</h3>
            <p>
              Short gold crates can be jumped. Cyan hanging bars must be slid under. Tall red
              blockers need a lane change. The ATS Monster always leaves one safe lane.
            </p>
          </section>
          <section>
            <h3>Streaks</h3>
            <p>
              Near misses and applications build an APPLICATION STREAK. Getting hit resets it. ATS
              scans are dodge-the-safe-lane mini-bosses. Interviews are short multiple-choice
              pop quizzes that still end in POSITION ELIMINATED.
            </p>
          </section>
          <section>
            <h3>Pickups</h3>
            <ul>
              <li>
                <b>Experience</b> — +1 year, still not enough
              </li>
              <li>
                <b>Referral</b> — invincibility
              </li>
              <li>
                <b>Coffee</b> — speed
              </li>
              <li>
                <b>Networking / AI / Nepotism</b> — temporary unfair advantages
              </li>
            </ul>
          </section>
        </div>
        <Button onClick={onBack}>BACK</Button>
      </Panel>
    </div>
  );
}
