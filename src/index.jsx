import { render } from 'solid-js/web';
import './index.css';
// import App from './App'; // Базовая версия
import AppAdvanced from './AppAdvanced'; // Продвинутая версия с расширенными алертами

// Используем продвинутую версию с полным функционалом
render(() => <AppAdvanced />, document.getElementById('root'));