"use client";

import { SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import "./Navbar.css";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="navbar">
      <h2 className="logo">MySite</h2>
      <ul className="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>

        {isSignedIn ? (
          <li><UserButton /></li> // shows profile dropdown
        ) : (
          <li>
            <SignUpButton>
              <button className="sign-up">Sign Up</button>
            </SignUpButton>
          </li>
        )}
      </ul>
    </nav>
  );
}
