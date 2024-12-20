import React, { useEffect } from 'react';
import './aboutUs.css';
import { ParallaxProvider, Parallax } from 'react-scroll-parallax';
import {Link} from "react-router-dom";
import SaveNewPassword from "./save_new_password";

const AboutUs = () => {
    useEffect(() => {
        // Add the 'about-us-page' class for dark mode styling
        document.body.classList.add('about-us-page');

        return () => {
            // Clean up by removing the class when the component unmounts
            document.body.classList.remove('about-us-page');
        };
    }, []);
    let selectedGroupId = 1;
    return (
        <ParallaxProvider>
            <div className="main-container">
                <div className="text-container">
                    <h1 className="title">YuriPass: Менеджер паролей</h1>
                    <p className="subtitle">
                        Добро пожаловать в YuriPass, твой помощник в управлении паролями. Мы поможем тебе в хранении и управлении паролями, чтобы чуть-чуть упростить твою жизнь:)
                    </p>
                    <div className="buttons-container">
                        <Link to='/passwords'>
                        <button className="primary-button-about-us">Вперед</button>
                        </Link>
                        {/*<button className="secondary-button">Learn More</button>*/}
                    </div>
                </div>

                <Parallax className="image-container" y={[-20, 20]} >
                    <img
                        src="https://i.imgur.com/HQXSdzF.png"
                        alt="LockR Showcase"
                        className="styled-image"
                    />
                </Parallax>
            </div>

            <section className="features-section" id="features">
                <Parallax className="features-background" y={[10, -10]} >
                    <h2 className="section-title">Features That Set Us Apart</h2>
                    <div className="features-container">
                        <div className="feature-card">
                            <img src="https://cdn-icons-png.flaticon.com/512/3470/3470474.png" alt="Advanced Encryption" className="feature-image" />
                            <h3>Advanced Encryption</h3>
                            <p>We use military-grade encryption to ensure your data remains private and secure.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png" alt="User-Friendly Interface" className="feature-image" />
                            <h3>User-Friendly Interface</h3>
                            <p>Our intuitive design makes managing and accessing your passwords simple and efficient.</p>
                        </div>
                        <div className="feature-card">
                            <img src="https://static.thenounproject.com/png/3635299-200.png" alt="Seamless Integration" className="feature-image" />
                            <h3>Seamless Integration</h3>
                            <p>LockR integrates with all your devices and browsers for a consistent experience.</p>
                        </div>
                    </div>
                </Parallax>
            </section>

            <section className="community" id="contact">
                <Parallax className="community-background" y={[5, -5]} >
                    <h2>Join the LockR Community</h2>
                    <p>Connect with other users, stay updated with our latest news, and engage with our vibrant community through social media.</p>
                </Parallax>
            </section>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo"><img
                        src="https://i.imgur.com/WR8JhwQ.png"
                        alt="Expanded Logo"
                        style={{width: '100%', maxHeight: '60px', objectFit: 'contain',}}
                    /></div>
                    <div className="footer-social">
                        <a href="#" className="social-icon"><img src="https://img.icons8.com/ios/50/000000/facebook.png"
                                                                 alt="Facebook"/></a>
                        <a href="#" className="social-icon"><img src="https://img.icons8.com/ios/50/000000/telegram.png"
                                                                 alt="Telegram"/></a>
                        <a href="#" className="social-icon"><img src="https://img.icons8.com/ios/50/000000/linkedin.png"
                                                                 alt="LinkedIn"/></a>
                        <a href="#" className="social-icon"><img
                            src="https://img.icons8.com/ios/50/000000/instagram.png" alt="Instagram"/></a>
                    </div>
                    <p className="footer-text">&copy; 2024 YuriPass. All rights reserved.</p>
                </div>

            </footer>
        </ParallaxProvider>
    );
};

export default AboutUs;
