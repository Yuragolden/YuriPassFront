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

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo"><img
                        src="https://icon-library.com/images/password-icon-png/password-icon-png-28.jpg"
                        alt="Expanded Logo"
                        style={{width: '100%', maxHeight: '60px', objectFit: 'contain',}}
                    /></div>
                    <div className="footer-social">
                        <a href="https://t.me/yura_golden" className="social-icon"><img src="https://img.icons8.com/ios/50/000000/telegram.png"
                                                                 alt="Telegram"/></a>
                        <a href="https://github.com/Yuragolden" className="social-icon"><img src="https://img.icons8.com/ios/50/000000/github.png"
                                                                 alt="Viber"/></a>
                        <a href="https://www.instagram.com/yura_golden_" className="social-icon"><img
                            src="https://img.icons8.com/ios/50/000000/instagram.png" alt="Instagram"/></a>
                    </div>
                    <p className="footer-text">&copy; 2024 YuriPass. All rights reserved.</p>
                </div>

            </footer>
        </ParallaxProvider>
    );
};

export default AboutUs;
