import React from 'react';

function GraphSvg() {
  return (
    <svg
      className="ls-graphSvg"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BEE3FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFB4D9" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="760" height="260" rx="18" fill="url(#g2)" opacity="0.18" />

      <path
        d="M30 210 C 90 150, 130 230, 190 165 C 250 100, 290 180, 350 150 C 410 120, 450 190, 510 165 C 570 140, 610 215, 700 145 L 700 240 L 30 240 Z"
        fill="url(#g1)"
        opacity="0.55"
      />

      <path
        d="M30 200 C 90 140, 130 220, 190 155 C 250 90, 290 170, 350 140 C 410 110, 450 180, 510 155 C 570 130, 610 205, 700 135"
        stroke="#0EA5E9"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />

      <path
        d="M30 175 C 85 120, 150 210, 215 145 C 280 80, 320 145, 385 130 C 450 115, 470 170, 545 145 C 620 120, 640 185, 700 120"
        stroke="#FF6BCB"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />

      <g opacity="0.45">
        <circle cx="100" cy="170" r="8" fill="#0EA5E9" />
        <circle cx="360" cy="135" r="9" fill="#FF6BCB" />
        <circle cx="610" cy="150" r="8" fill="#2DD4BF" />
      </g>
    </svg>
  );
}

export default function LandingPreviewMock() {
  return (
    <section className="ls-previewCard" aria-label="Dashboard preview mockup">
      <aside className="ls-sidebar" aria-label="Dashboard sidebar">
        <div className="ls-sidebarBrand">
          <div className="ls-sidebarBrandBadge">StudySmart</div>
        </div>

        <div className="ls-sideList" role="navigation" aria-label="Sidebar navigation">
          <div className="ls-sideItem isActive">
            <span className="ls-sideDot" aria-hidden="true" />
            Overview
          </div>
          <div className="ls-sideItem">
            <span className="ls-sideDot" aria-hidden="true" />
            Sessions
          </div>
          <div className="ls-sideItem">
            <span className="ls-sideDot" aria-hidden="true" />
            Groups
          </div>
          <div className="ls-sideItem">
            <span className="ls-sideDot" aria-hidden="true" />
            Collaborators
          </div>
        </div>
      </aside>

      <div className="ls-mainPanel" aria-label="Dashboard overview panel">
        <div className="ls-panelTop">
          <div className="ls-panelTitleRow">
            <div className="ls-panelTitleBox">
              <div className="ls-panelIcon" aria-hidden="true" />
              <p className="ls-panelText">
                This shows an overview of your contributions to your desired groups and
                collaborations made in groups or with collaborators in general.
              </p>
            </div>
          </div>
        </div>

        <div className="ls-panelBody">
          <div className="ls-weekHeader">
            <h2 className="ls-weekTitle">Weekly Discussions</h2>
            <button className="ls-filterBtn" type="button">
              Filters <span className="ls-filterCaret" aria-hidden="true">▾</span>
            </button>
          </div>

          <div className="ls-graphWrap">
            <GraphSvg />
          </div>
        </div>
      </div>

      <div className="ls-cornersArrows" aria-hidden="true">
        <div className="ls-cornerArrow left" />
        <div className="ls-cornerArrow right" />
      </div>
    </section>
  );
}

