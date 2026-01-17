import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">MySite</h2>
      <ul className="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a className="sign-up" href="/sign-up">Sign Up</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;