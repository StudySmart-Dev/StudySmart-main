import React from 'react';
import { Link } from 'react-router-dom';

function BookMarkIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 8.2C7.5 7.53726 8.03726 7 8.7 7H17.3C17.9627 7 18.5 7.53726 18.5 8.2V28.1C18.5 28.7627 17.9627 29.3 17.3 29.3H8.7C8.03726 29.3 7.5 28.7627 7.5 28.1V8.2Z"
        stroke="#0B0B0F"
        strokeWidth="2"
      />
      <path
        d="M18.5 8.2C18.5 7.53726 19.0373 7 19.7 7H26.8C27.4627 7 28 7.53726 28 8.2V28.1C28 28.7627 27.4627 29.3 26.8 29.3H19.7C19.0373 29.3 18.5 28.7627 18.5 28.1V8.2Z"
        stroke="#0B0B0F"
        strokeWidth="2"
      />
      <path
        d="M18.3 13C16 11.6 13.6 11.2 10.8 12"
        stroke="#0B0B0F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.3 17C16 15.6 13.6 15.2 10.8 16"
        stroke="#0B0B0F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TopNav() {
  return (
    <header className="ls-topNav" role="banner">
      <div className="ls-topNavInner">
        <div className="ls-brand" aria-label="StudySmart home">
          <BookMarkIcon />
        </div>

        <nav className="ls-menu" aria-label="Primary navigation">
          <Link className="ls-menuLink" to="/">
            Home
          </Link>
          <Link className="ls-menuLink" to="/features">
            Features
          </Link>
          <Link className="ls-menuLink" to="/pricing">
            Pricing
          </Link>
          <Link className="ls-menuLink" to="/contact">
            Contact
          </Link>
        </nav>

        <div className="ls-topCtas">
          <Link className="ls-ctaBtn" to="/create-account">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
