"use client";

import "./home.css";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaHandsHelping } from "react-icons/fa";
import { FaShieldAlt } from "react-icons/fa";
import { IoFolder } from "react-icons/io5";
import { FaSchool } from "react-icons/fa";
import { FaSlidersH } from "react-icons/fa";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="grid-background dark:block light:hidden" />
      <div className="grid-background-light dark:hidden light:block" />

      {/* Hero card */}
      <div className="hero-card relative z-10">
        <h1>
          <span className="lostHero">Lost Something?</span>
          <span className="panicHero">Don’t Panic.</span>
        </h1>
        <p>
          Connecting student, staff, and schools and reuniting them with their
          lost items
        </p>
        <button className="browse">Browse Lost Items</button>
        <button className="report">Report a Lost Item</button>
      </div>

      {/* Carousel */}
      <div className="carousel relative z-10">
        <div className="track">
          {/* Original set */}
          <div className="card">
            <span className="card-icon">
              <IoFolder className="text-blue-500" />
            </span>
            <h3 className="card-title">One Place for Everything</h3>
            <p className="card-body">
              Stop checking multiple offices or bulletin boards. All lost and
              found items live in one clean, searchable place.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSchool className="text-blue-500" />
            </span>
            <h3 className="card-title">Designed for Campuses</h3>
            <p className="card-body">
              Findr is made specifically for schools — from hallways to gyms to
              libraries — so nothing slips through the cracks.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSearch className="text-blue-500" />
            </span>
            <h3 className="card-title">Find Items Faster</h3>
            <p className="card-body">
              Quickly match lost items with found ones and get belongings back
              to students in days, not weeks.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSlidersH className="text-blue-500" />
            </span>
            <h3 className="card-title">Search What Matters</h3>
            <p className="card-body">
              Filter by category, location, and time to instantly narrow down
              results and spot your item.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaHandsHelping className="text-blue-500" />
            </span>
            <h3 className="card-title">Students Helping Students</h3>
            <p className="card-body">
              Anyone can report a found item, creating a trusted, school-wide
              system that actually works.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaShieldAlt className="text-blue-500" />
            </span>
            <h3 className="card-title">Secure by Design</h3>
            <p className="card-body">
              Only your school community sees your items, keeping reports
              private and protected.
            </p>
          </div>

          {/* Duplicate set for seamless loop */}
          <div className="card">
            <span className="card-icon">
              <IoFolder className="text-blue-500" />
            </span>
            <h3 className="card-title">One Place for Everything</h3>
            <p className="card-body">
              Stop checking multiple offices or bulletin boards. All lost and
              found items live in one clean, searchable place.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSchool className="text-blue-500" />
            </span>
            <h3 className="card-title">Designed for Campuses</h3>
            <p className="card-body">
              Findr is made specifically for schools — from hallways to gyms to
              libraries — so nothing slips through the cracks.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSearch className="text-blue-500" />
            </span>
            <h3 className="card-title">Find Items Faster</h3>
            <p className="card-body">
              Quickly match lost items with found ones and get belongings back
              to students in days, not weeks.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaSlidersH className="text-blue-500" />
            </span>
            <h3 className="card-title">Search What Matters</h3>
            <p className="card-body">
              Filter by category, location, and time to instantly narrow down
              results and spot your item.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaHandsHelping className="text-blue-500" />
            </span>
            <h3 className="card-title">Students Helping Students</h3>
            <p className="card-body">
              Anyone can report a found item, creating a trusted, school-wide
              system that actually works.
            </p>
          </div>

          <div className="card">
            <span className="card-icon">
              <FaShieldAlt className="text-blue-500" />
            </span>
            <h3 className="card-title">Secure by Design</h3>
            <p className="card-body">
              Only your school community sees your items, keeping reports
              private and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
