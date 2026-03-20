import TopNav from '../ui/TopNav.jsx';
import LandingPreviewMock from '../ui/LandingPreviewMock.jsx';
import TrustRow from '../ui/TrustRow.jsx';

import '../styles/landing.css';

export default function Home() {
  return (
    <div className="ls-page">
      <TopNav />

      <main className="ls-main">
        <div className="ls-pill">Learn , collaborate and find study partners on campus</div>

        <h1 className="ls-title">
          Collaborate , Learn and Improve
          <br />
          Your Academics
        </h1>

        <TrustRow />

        <div className="ls-previewWrap" aria-label="Product preview mockup">
          <LandingPreviewMock />
        </div>

        <div className="ls-videoRow" aria-label="Video placeholder for product walkthrough">
          <h2 className="ls-videoTitle">See StudySmart in action</h2>
          <div className="ls-videoPlaceholder">
            <div className="ls-playBadge" aria-hidden="true">
              <span className="ls-playTri" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

