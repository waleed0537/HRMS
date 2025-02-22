import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import WOW from 'wow.js';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import HRMSLogo from '../assets1/images/HRMSLogo.png';
 import HRMSHeroImage from '../assets1/images/HRMSHeroImage.png';
import ShapeDot from '../assets1/images/shapes/dots.png';
import ShapeTraingle from '../assets1/images/shapes/tringle.png';
import ShapeClose from '../assets1/images/shapes/close.png';
import HRMSImage2 from '../assets1/images/HRMSImage2.png';
import HRMSImage3 from '../assets1/images/HRMSImage3.png';
import NL2 from '../assets1/images/newsletter/newsletter-two.png';
import NLCircle from '../assets1/images/newsletter/circle.png';
import NLDot from '../assets1/images/newsletter/dots.png';
import PWhite1 from '../assets1/images/partners/partner-three-white1.png';
import PWhite2 from '../assets1/images/partners/partner-three-white2.png';
import PWhite3 from '../assets1/images/partners/partner-three-white3.png';
import PWhite4 from '../assets1/images/partners/partner-three-white4.png';
import PWhite5 from '../assets1/images/partners/partner-three-white5.png';

// CSS imports
import '../assets1/css/flaticon.css';
import '../assets1/css/magnific-popup.css';
import '../assets1/css/animate.min.css';
import '../assets1/css/nice-select.css';
import '../assets1/css/spacing.min.css';
import '../assets1/css/menu.css';
import '../assets1/css/style.css';
import '../assets1/css/responsive.css';
const LandingPage = () => {
  const pageStyles = {
    background: 'linear-gradient(to right,rgb(0, 0, 0),rgb(21, 62, 102))', // Light gradient background
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden'
  };
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [updateFrequency, setUpdateFrequency] = useState('weekly');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    number: '',
    company: '',
    subject: '',
    website: '',
    message: ''
  });

  useEffect(() => {
    // Initialize WOW.js
    new WOW().init();
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter submitted:', { email, updateFrequency });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
// Added this method to handle radio button change

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <>
      <style>{`
        /* Reset default styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
        }
        
        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }
        
        /* Navigation styles */
        nav {
          background: transparent;
        }
        
        /* Hero section styles */
        .hero-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .hero-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        /* Button styles */
        .button-primary {
          background: #4F46E5;
          transition: all 0.3s ease;
        }
        
        .button-primary:hover {
          background: #4338CA;
        }

        /* Global styles for the page */
        body,
        .page-wrapper,
        .hero-section-three,
        .solutions-section-three,
        .about-section-three,
        .dashboard-section,
        .feedback-section-three,
        .contact-section-two,
        .footer-section {
          background: linear-gradient(135deg, #060b4d 0%, #01084e 100%) !important;
          color: #ffffff !important;
        }
        
        /* Ensure all text is white */
        h1, h2, h3, h4, h5, h6,
        p, a, li,
        .section-title,
        .contact-info-item,
        .footer-widget p,
        .footer-widget a,
        .list-style-three li {
          color: #ffffff !important;
        }
        
        /* Style form elements */
        input,
        textarea,
        .form-control {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        
        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Style buttons */
        .theme-btn,
        .login,
        button[type="submit"] {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
        }
        
        .theme-btn:hover,
        .login:hover,
        button[type="submit"]:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        /* Style navigation */
        .nav-search button,
        .nav-search form {
          background-color: transparent !important;
          color: #ffffff !important;
        }
        
        /* Style cards and sections */
        .solution-item-three,
        .service-item,
        .contact-info-item {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        /* Fix any dark backgrounds */
        .bg-blue,
        .bg-gray,
        .bg-lighter {
          background: transparent !important;
        }
      `}</style>
    <div className="hrms-landing-page">
    <div className="page-wrapper" style={{background: 'linear-gradient(to right,rgb(0, 0, 0),rgb(21, 62, 102))' }} >
      {/* Header Section */}
     {/* Header Section */}
{/* Header Section */}
{/* Header Section */}
<header className="main-header header-three" >
<div className="header-upper">
  <div className="container">
    <div className="header-inner py-3 px-4">
      <div className="logo-outer">
        <div className="logo">
          <a href="/">
            <img 
              src={HRMSLogo}
              alt="Logo" 
              style={{ width: "150px", height: "auto" }} 
            />
          </a>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="nav-outer clearfix" >
        {/* Desktop Menu */}
        <nav className="main-menu navbar-expand-lg d-none d-lg-block">
          <div className="navbar-collapse">
            <ul className="navigation">
              <li><a href="/" className="text-white">Home</a></li>
              <li><a href="/about" className="text-white">About</a></li>
              <li><a href="/services" className="text-white">Services</a></li>
              <li><a href="/contact" className="text-white">Contact</a></li>
            </ul>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="d-flex d-lg-none align-items-center">
                <div className="nav-search me-3">
                  <button 
                    className="fa fa-search"
                    style={{
                      background: 'transparent',
                      border: "none",
                      color: "#fff"
                    }} 
                    onClick={() => setSearchOpen(!searchOpen)}
                  ></button>
                </div>
                <button 
                  type="button" 
                  className="navbar-toggle"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  style={{ 
                    border: "none",
                    padding: "0",
                    background: "transparent",
                    marginLeft: "10px"
                  }}
                >
                  <span className="icon-bar" style={{ 
                    background: "#fff",
                    height: "2px", 
                    width: "22px", 
                    marginBottom: "4px", 
                    display: "block" 
                  }}></span>
                  <span className="icon-bar" style={{ 
                    background: "#fff",
                    height: "2px", 
                    width: "22px", 
                    marginBottom: "4px", 
                    display: "block" 
                  }}></span>
                  <span className="icon-bar" style={{ 
                    background: "#fff",
                    height: "2px", 
                    width: "22px", 
                    display: "block" 
                  }}></span>
                </button>
              </div>
            </div>

      {/* Desktop Buttons */}
      <div className="menu-right d-none d-lg-flex align-items-center">
      <div className="menu-right d-none d-lg-flex align-items-center">
      <button 
onClick={() => navigate('/signin')} 
className="theme-btn" 
style={{ 
  padding: "8px 20px",
  marginRight: "10px",
  borderRadius: "5px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  color: "#fff",
  border: "none",
  cursor: "pointer"
}}
>
Login <i className="fas fa-lock ms-1"></i>
</button>
<a href="/signup" className="theme-btn" style={{ 
  padding: "8px 20px",
  borderRadius: "5px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  color: "#fff",
  textDecoration: "none"
}}>
  Sign Up <i className="fas fa-arrow-right ms-1"></i>
</a>
</div>
      </div>
    </div>

    {/* Mobile Menu */}
    <div 
      className={`mobile-menu ${isMenuOpen ? 'show' : ''}`}
      style={{
        position: "absolute",
        top: "100%",
        left: "0",
        right: "0",
        background: 'linear-gradient(45deg, #1a237e, #121858)',
        padding: isMenuOpen ? "20px" : "0",
        transition: "all 0.3s ease",
        opacity: isMenuOpen ? "1" : "0",
        visibility: isMenuOpen ? "visible" : "hidden",
        zIndex: "1000"
      }}
    >
      <ul className="navigation clearfix text-center">
        <li><a href="/" className="text-white">Home</a></li>
        <li><a href="/about" className="text-white">About</a></li>
        <li><a href="/services" className="text-white">Services</a></li>
        <li><a href="/contact" className="text-white">Contact</a></li>
        <li className="mt-3">
        <Link to="/signin" className="theme-btn d-inline-block" style={{ 
  padding: "8px 20px",
  marginRight: "10px",
  borderRadius: "5px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  textDecoration: "none"
}}>
  Login
</Link>
          <a href="/signup" className="theme-btn d-inline-block" style={{ 
            padding: "8px 20px",
            borderRadius: "5px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
     
            textDecoration: "none"
          }}>
            Sign Up
          </a>
        </li>
      </ul>
    </div>

    {/* Search Overlay */}
    {searchOpen && (
      <div className="search-overlay" style={{
        position: "absolute",
        top: "100%",
        left: "0",
        right: "0",
        padding: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: "1000"
      }}>
        <form action="#" className="d-flex">
          <input 
            type="text" 
            placeholder="Search" 
            className="form-control" 
            style={{
              backgroundColor: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff"
            }}
          />
          <button type="submit" className="btn" style={{ color: "#fff" }}>
            <i className="fa fa-search"></i>
          </button>
        </form>
      </div>
    )}
  </div>
</div>
</header>

      {/* Hero Section */}
      <section className="hero-section-three rel z-2 pt-235 rpt-150 pb-130 rpb-100" style={{
      background: 'linear-gradient(45deg, #1a237e, #121858)'
    }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-11">
              <div className="hero-content-three rpt-15 rmb-75">
                <h1 className="mb-15 wow fadeInUp delay-0-2s">
                  Streamline Your Workforce with Our HRMS
                </h1>
                <p className="wow fadeInUp delay-0-4s">
                  Manage employees, branches, recruitment, communication, and performance seamlessly with our advanced HRMS solution. 
                  Built for scalability, security, and efficiency.
                </p>
                <form className="newsletter-form mt-40" onSubmit={handleNewsletterSubmit}>
                  <div className="newsletter-email wow fadeInUp delay-0-6s">
                    <input 
                      type="email" 
                      placeholder="Enter Email Address" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit">
                      Request a Demo <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                  <div className="newsletter-radios wow fadeInUp delay-0-8s">
                    <div className="custom-control custom-radio">
                      
                    
                    </div>
                    <div className="custom-control custom-radio">
                      
                      
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image-three  wow fadeInLeft delay-0-4s">
              <img 
                src={HRMSHeroImage}
                alt="HRMS Dashboard Preview" 
                style={{ marginTop: "-50px" }} 
              />
              </div>
            </div>
          </div>
        </div>
        <img className="dots-shape" src={ShapeDot} alt="Shape" />
        <img className="tringle-shape" src={ShapeTraingle} alt="Shape" />
        <img className="close-shape" src={ShapeClose} alt="Shape" />
</section>


    {/* Solutions Section */}
<section 
className="solutions-section-three text-white text-center rel bg-blue pt-130 rpt-100 z-1 pb-75 rpb-45"
style={{
  backgroundImage: `radial-gradient(circle at center, #1a1f37 0%, #1a1f37 100%), url(/assets1/images/shapes/solutions-bg-dots.png)`,
  backgroundSize: "30px 30px",
  backgroundPosition: "0 0",
  backgroundRepeat: "repeat"
}}
>
<div className="container">
  <div className="row justify-content-center">
    <div className="col-xl-7 col-lg-8 col-md-10">
      <div className="section-title mb-75">
        <h2>Empowering Workforce Management with Smart Solutions</h2>
      </div>
    </div>
  </div>
  <div className="row justify-content-center">
    <div className="col-xl-4 col-md-6">
      <div className="solution-item-three wow fadeInUp delay-0-2s">
        <i className="far fa-user"></i>
        <h3><a href="/single-service">Employee Management</a></h3>
        <p>Maintain detailed employee profiles, track roles, and manage hierarchical structures efficiently across branches.</p>
        <a href="/single-service" className="read-more">
          Learn More <i className="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
    <div className="col-xl-4 col-md-6">
      <div className="solution-item-three wow fadeInUp delay-0-4s">
        <i className="fas fa-chart-line"></i>
        <h3><a href="/single-service">Performance Tracking</a></h3>
        <p>Monitor KPIs, attendance, and agent productivity with real-time analytics and automated performance scorecards.</p>
        <a href="/single-service" className="read-more">
          Learn More <i className="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
    <div className="col-xl-4 col-md-6">
      <div className="solution-item-three wow fadeInUp delay-0-6s">
        <i className="fas fa-user-plus"></i>
        <h3><a href="/single-service">Recruitment & Onboarding</a></h3>
        <p>Streamline hiring with a candidate database, onboarding workflows, and automated communication tools.</p>
        <a href="/single-service" className="read-more">
          Learn More <i className="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  </div>
</div>
</section>


<section className="about-section-three rel z-1 pt-130 rpt-100">
  <div className="container">
      <div className="row align-items-center">
          <div className="col-xl-7 col-lg-6">
              <div className="about-image rmb-55 wow fadeInLeft delay-0-2s">
                  <img src={HRMSImage2} alt="About HRMS" />
              </div>
          </div>
          <div className="col-xl-5 col-lg-6">
              <div className="about-content-three wow fadeInRight delay-0-2s">
                  <div className="section-title mb-25">
                     
                      <h2>Transform Workforce Management with Our HRMS</h2>
                  </div>
                  <p>Our HRMS streamlines employee management, recruitment, performance tracking, and communication. Designed for efficiency, scalability, and seamless integration, it empowers businesses to optimize their workforce operations.</p>
                  <ul className="list-style-one mt-25 mb-35">
                      <li>Employee & Branch Management</li>
                      <li>Performance Tracking & Analytics</li>
                      <li>Recruitment & Onboarding</li>
                      <li>Messaging & Communication</li>
                  </ul>
                  <a href="about.html" className="theme-btn style-three">Get Started <i className="fas fa-arrow-right"></i></a>
              </div>
          </div>
      </div>
  </div>
</section>
<section className="browswr-support-section rel z-1 py-130 rpy-100">
  <div className="container">
      <div className="row align-items-center">
          <div className="col-xl-5 col-lg-6">
              <div className="browswr-support-content rmb-55 wow fadeInRight delay-0-2s">
                  <div className="section-title">
                    
                      <h2>Access Your HRMS Anytime, Anywhere</h2>
                  </div>
                  <div className="row">
                      <div className="col-md-6">
                          <div className="solution-item-two">
                              <i className="fas fa-check"></i>
                              <h4>Cross-Platform Compatibility</h4>
                              <p>Access HRMS on any device—desktop, tablet, or mobile—ensuring seamless employee and branch management on the go.</p>
                          </div>
                      </div>
                      <div className="col-md-6">
                          <div className="solution-item-two color-two">
                              <i className="fas fa-check"></i>
                              <h4>Secure & Role-Based Access</h4>
                              <p>Ensure data security with granular access controls, allowing employees to access only what they need based on their role.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div className="col-xl-7 col-lg-6">
              <div className="browswr-support-image text-lg-right wow fadeInLeft delay-0-2s">
                  <img src={HRMSImage3} alt="HRMS Accessibility" />
              </div>
          </div>
      </div>
  </div>
</section>

<section className="newsletter-section-two mt-30 rmt-0 rel z-2">
      <div className="container">
        <div className="newsletter-inner style-two bg-gray bgs-cover text-white rel z-1">
          <div className="row align-items-center align-items-xl-start">
            <div className="col-lg-6">
              <div className="newsletter-content p-60 wow fadeInUp delay-0-2s">
                <div className="section-title mb-30">
                 
                  <h2>Subscribe to HRMS Insights & Feature Updates</h2>
                </div>
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <div className="newsletter-email">
                    <input 
                      type="email" 
                      placeholder="Enter Email Address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                    <button type="submit">Subscribe <i className="fas fa-angle-right"></i></button>
                  </div>
                  
                </form>
              </div>
            </div>
              <div className="col-lg-6">
                  <div className="newsletter-images wow fadeInUp delay-0-4s">
                      <img src={NL2} alt="HRMS Newsletter" />
                      <img src={NLCircle} alt="shape" className="circle slideUpRight" />
                      <img src={NLDot} alt="shape" className="dots slideLeftRight" />
                  </div>
              </div>
          </div>
      </div>
  </div>
</section>
<section className="services-section-three bg-lighter rel z-1 pt-250 pb-100 rpb-70">
  <div className="container">
     <div className="row justify-content-center text-center">
         <div className="col-xl-7 col-lg-8 col-md-10">
             <div className="section-title mt-100 rmt-70 mb-55">

                  <h2>Enhancing Workforce Efficiency with Smart HRMS</h2>
              </div>
         </div>
     </div>
      <div className="row">
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-2s">
                  <i className="flaticon-file"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Employee Management</a></h3>
                      <p>Maintain employee records, track roles, and ensure seamless HR operations across all branches.</p>
                  </div>
              </div>
          </div>
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-4s">
                  <i className="flaticon-responsive-design"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Recruitment & Onboarding</a></h3>
                      <p>Automate candidate tracking, streamline hiring, and facilitate smooth onboarding experiences.</p>
                  </div>
              </div>
          </div>
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-6s">
                  <i className="flaticon-security"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Role-Based Security</a></h3>
                      <p>Ensure secure access controls, protecting sensitive employee and branch data at all levels.</p>
                  </div>
              </div>
          </div>
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-0-8s">
                  <i className="flaticon-puzzle"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Performance Tracking</a></h3>
                      <p>Evaluate employee performance with real-time KPIs, attendance tracking, and scorecards.</p>
                  </div>
              </div>
          </div>
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-1-0s">
                  <i className="flaticon-badge"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Messaging & Communication</a></h3>
                      <p>Enable seamless communication between HR, management, and employees with in-platform messaging.</p>
                  </div>
              </div>
          </div>
          <div className="col-xl-4 col-md-6">
              <div className="service-item wow fadeInUp delay-1-2s">
                  <i className="flaticon-analytics"></i>
                  <div className="content">
                      <h3><a href="single-service.html">Advanced Analytics</a></h3>
                      <p>Gain insights into workforce trends, sales performance, and HR metrics with data-driven reports.</p>
                  </div>
              </div>
          </div>
      </div>
  </div>
</section>

      {/* Dashboard Section */}
      <section className="dashboard-section rel z-1 py-130 rpy-100">
<div className="container">
  <div className="row justify-content-center text-center">
    <div className="col-xl-7 col-lg-8 col-md-10">
      <div className="section-title mb-60">
      
        <h2>Monitor & Manage Your Workforce with an Intuitive Dashboard</h2>
      </div>
    </div>
  </div>
  <Slider {...sliderSettings}>
    <div className="dashboard-screenshot-item">
      <img src="./assets1/images/dashboard-screenshots/hrms-dashboard1.jpg" alt="Employee Management Dashboard" />
    </div>
    <div className="dashboard-screenshot-item">
      <img src="./assets1/images/dashboard-screenshots/hrms-dashboard2.jpg" alt="Performance Analytics Dashboard" />
    </div>
    <div className="dashboard-screenshot-item">
      <img src="./assets1/images/dashboard-screenshots/hrms-dashboard3.jpg" alt="Recruitment & Attendance Dashboard" />
    </div>
  </Slider>
</div>
</section>


      
          {/* <!--====== Partner Section Start ======--> */}
      <div className="partner-area-three text-center pt-130 rpt-100">
          <div className="container">
              <div className="row justify-content-around justify-content-lg-between mb-80 rmb-50">
                  <div className="col-lg-2 col-md-4 col-6">
                      <a className="partner-item-three wow fadeInUp delay-0-2s" href="project-details.html">
                          <img src={PWhite1} alt="Partner" />
                      </a>
                  </div>
                  <div className="col-lg-2 col-md-4 col-6">
                      <a className="partner-item-three wow fadeInUp delay-0-4s" href="project-details.html">
                          <img src={PWhite2}  alt="Partner" />
                      </a>
                  </div>
                  <div className="col-lg-2 col-md-4 col-6">
                      <a className="partner-item-three wow fadeInUp delay-0-6s" href="project-details.html">
                          <img src={PWhite3}  alt="Partner" />
                      </a>
                  </div>
                  <div className="col-lg-2 col-md-4 col-6">
                      <a className="partner-item-three wow fadeInUp delay-0-8s" href="project-details.html">
                          <img src={PWhite4}  alt="Partner" />
                      </a>
                  </div>
                  <div className="col-lg-2 col-md-4 col-6">
                      <a className="partner-item-three wow fadeInUp delay-1-0s" href="project-details.html">
                          <img src={PWhite5}  alt="Partner" />
                      </a>
                  </div>
              </div>
              <hr />
          </div>
      </div>
      {/* Contact Section */}
      <section style={{
    padding: '115px 0 130px',
    position: 'relative',
    zIndex: 1
  }}>
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 15px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: '42px',
          marginBottom: '20px'
        }}>Contact Us</h2>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
        <form
          style={{
            width: '100%',
            maxWidth: '800px',
            padding: '45px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            <div>
              <input
                type="text"
                placeholder="Full Name"
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address"
                required
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Phone Number"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Company"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div>
              <input
                type="url"
                placeholder="Website"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <textarea
                placeholder="Message"
                required
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  resize: 'vertical',
                  transition: 'all 0.3s ease'
                }}
              ></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 40px',
      
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '20px'
                }}
              >
                Submit <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>


      {/* Footer */}
      <footer className="footer-section footer-two bg-gray text-white rel z-1">
        <div className="container">
          <div className="footer-top py-50">
            <div className="row">
              <div className="col-lg-3 col-md-6">
                <div className="footer-widget">
                <h4 className="footer-title">About Company</h4>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla id tincidunt erat.</p>
                  <div className="social-style-one mt-20">
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                    <a href="#"><i className="fab fa-linkedin-in"></i></a>
                    <a href="#"><i className="fab fa-instagram"></i></a>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-widget">
                  <h4 className="footer-title">Quick Links</h4>
                  <ul className="list-style-two">
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/services">Our Services</a></li>
                    <li><a href="/products">Products</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-widget">
                  <h4 className="footer-title">Support</h4>
                  <ul className="list-style-two">
                    <li><a href="/help">Help Center</a></li>
                    <li><a href="/faq">FAQ</a></li>
                    <li><a href="/privacy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms of Service</a></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="footer-widget">
                  <h4 className="footer-title">Contact Info</h4>
                  <ul className="list-style-three">
                    <li>
                      <i className="fas fa-map-marker-alt"></i>
                      <span>123 Street Name, City, Country</span>
                    </li>
                    <li>
                      <i className="fas fa-envelope"></i>
                      <a href="mailto:info@example.com">info@example.com</a>
                    </li>
                    <li>
                      <i className="fas fa-phone"></i>
                      <a href="tel:+1234567890">+123 456 7890</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="copyright-area text-center py-20">
            <p>© 2024 hrrive. All Rights Reserved</p>
          </div>
        </div>
        <img className="dots-shape" src={ShapeDot} alt="Shape" />
        <img className="tringle-shape" src={ShapeTraingle} alt="Shape" />
        <img className="close-shape" src={ShapeClose} alt="Shape" />
      </footer>

      {/* Scroll Top Button */}
      <button 
        className="scroll-top scroll-to-target" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="fa fa-angle-up"></span>
      </button>
    </div>
    </div>
    </>
  );
};

export default LandingPage;