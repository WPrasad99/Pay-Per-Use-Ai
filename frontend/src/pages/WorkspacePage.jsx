import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // Refresh V3
import { useNavigate, useParams } from 'react-router-dom';
import { useSiwa } from '../hooks/useSiwa';
import { peraWallet } from '../config/peraWallet';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
    depositWalletFunds,
    generateImage,
    getConversationHistory,
    getConversationMessages,
    getPaymentInfo,
    getServices,
    mintNFT,
    streamChat,
    transferNFT,
    getUserProfile,
    getUserAnalytics,
    deleteConversation,
    getCreatorProfile,
    getCreatorAgents,
    getAgentDetails,
    chatWithAgent,
    saveCreatorApiKey,
    getApiKeyStatus,
    createCreatorProfile,
} from '../api/client';

const MODEL_ICONS = {
    // OpenAI GPT-4o
    gpt4o_mini: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 512 509.639">
            <path fill="#fff" d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.613-115.613 115.613H115.612C52.026 509.64 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"/><path fillRule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
        </svg>
    ),
    // Google Gemini
    gemini_flash: (
        <svg className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65">
            <mask id="maskme" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65"><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#prefix__paint0_linear_2001_67)"/></mask><g mask="url(#maskme)"><g filter="url(#prefix__filter0_f_2001_67)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g><g filter="url(#prefix__filter1_f_2001_67)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g><g filter="url(#prefix__filter2_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#prefix__filter3_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#prefix__filter4_f_2001_67)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g><g filter="url(#prefix__filter5_f_2001_67)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g><g filter="url(#prefix__filter6_f_2001_67)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g><g filter="url(#prefix__filter7_f_2001_67)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g><g filter="url(#prefix__filter8_f_2001_67)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g><g filter="url(#prefix__filter9_f_2001_67)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g><g filter="url(#prefix__filter10_f_2001_67)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g></g><defs><filter id="prefix__filter0_f_2001_67" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter1_f_2001_67" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter2_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter3_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter4_f_2001_67" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter5_f_2001_67" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter6_f_2001_67" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter7_f_2001_67" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter8_f_2001_67" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter9_f_2001_67" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter10_f_2001_67" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67"/></filter><linearGradient id="prefix__paint0_linear_2001_67" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stopColor="#4893FC"/><stop offset=".27" stopColor="#4893FC"/><stop offset=".777" stopColor="#969DFF"/><stop offset="1" stopColor="#BD99FE"/></linearGradient></defs>
        </svg>
    ),
    // Ollama (Replacing Meta Llama)
    llama3: (
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.73 2.01c-.19.03-.41.13-.57.25-.48.36-.85 1.13-1.01 2.1-.06.36-.1.87-.1 1.25 0 .45.05 1.03.13 1.43.02.09.03.17.02.17 0 0-.08.06-.16.13-.27.22-.58.55-.79.85a4.56 4.56 0 0 0-.78 1.95c-.04.28-.05.85-.02 1.13.08.65.27 1.2.61 1.7l.11.16-.03.05c-.22.38-.41.92-.5 1.44-.07.41-.08.52-.08 1.08s0 .67.07 1.06c.08.46.24.95.42 1.28.06.11.2.33.22.34 0 0-.01.06-.04.12a6.3 6.3 0 0 0-.46 1.56c-.05.35-.06.46-.06.83 0 .47.03.69.12 1.07v.05h1.24l-.04-.08c-.25-.46-.27-1.31-.06-2.16.1-.39.21-.68.41-1.08l.12-.24v-.15c0-.14 0-.15-.05-.24a.7.7 0 0 0-.16-.21c-.14-.13-.24-.28-.32-.45-.35-.77-.42-1.91-.17-2.88.1-.4.27-.77.45-.96.12-.13.19-.29.19-.44s-.06-.3-.19-.44c-.37-.4-.6-.88-.68-1.44-.12-.8.09-1.67.57-2.36.47-.68 1.13-1.11 1.87-1.23.17-.03.47-.02.65 0 .19.03.31.02.43-.03.15-.07.22-.16.31-.36.08-.18.14-.28.3-.48.2-.24.38-.41.68-.61.34-.23.74-.39 1.13-.47.14-.03.21-.03.47-.03s.33 0 .47.03c.57.12 1.14.41 1.6.83.1.09.33.38.41.5.03.05.08.15.11.22.09.2.16.29.31.36.12.06.24.07.42.04.29-.05.51-.04.79.01.95.19 1.78.98 2.15 2.03.32.92.23 1.89-.25 2.63-.08.12-.16.23-.28.35-.25.27-.25.6 0 .88.41.45.67 1.56.59 2.53-.05.64-.22 1.22-.44 1.55-.04.06-.12.16-.19.22-.08.08-.13.14-.16.21-.04.09-.05.11-.05.24v.15l.12.24c.21.4.32.69.41 1.08.21.84.19 1.68-.05 2.15l-.04.08h1.22l.02-.06s.02-.08.03-.11c.02-.06.05-.25.07-.43s.02-.85 0-1.05c-.09-.73-.25-1.31-.5-1.86a.4.4 0 0 1-.04-.12s.05-.06.09-.13c.31-.47.51-1.07.6-1.86.03-.22.03-1.15 0-1.36-.07-.54-.15-.9-.29-1.27-.06-.15-.21-.48-.27-.58l-.03-.05.11-.16c.33-.5.53-1.05.61-1.7.03-.28.02-.85-.02-1.13a4.56 4.56 0 0 0-.78-1.95 4.6 4.6 0 0 0-.95-.98s0-.08.02-.17c.17-.91.17-2.04-.01-2.92-.16-.77-.45-1.38-.82-1.73-.3-.28-.6-.4-.96-.38-.83.05-1.5 1-1.76 2.51-.04.24-.08.53-.08.6 0 .03 0 .05-.01.05s-.06-.03-.12-.06c-.64-.38-1.35-.58-2.05-.58s-1.41.2-2.05.58c-.06.04-.12.06-.12.06s-.01-.02-.01-.05c0-.08-.04-.37-.08-.6-.24-1.35-.79-2.25-1.52-2.47-.1-.03-.39-.05-.49-.03Zm.24 1.17c.21.16.44.63.57 1.16.02.09.05.2.06.24 0 .04.02.13.03.19.06.3.08.63.08 1.03v.39l-.1.15-.1.15h-.23c-.27 0-.54.03-.8.1-.09.02-.18.05-.2.05-.03 0-.03 0-.05-.12-.08-.64-.08-1.35.01-1.94.1-.66.34-1.25.58-1.43.06-.04.07-.04.13.01Zm8.19-.01c.14.1.3.38.41.74.23.71.3 1.69.18 2.62-.02.12-.02.13-.05.12-.02 0-.11-.03-.2-.05-.26-.07-.53-.1-.8-.1h-.23l-.1-.15-.1-.15v-.39c0-.56.06-.99.18-1.48.13-.52.36-.99.57-1.15.06-.05.07-.05.13-.01Z"/><path d="M11.78 10.39c-.31.03-.4.04-.55.07-.24.05-.57.16-.79.27-.78.38-1.32 1.02-1.49 1.76-.03.15-.04.2-.04.44s0 .3.04.44c.22.97 1.11 1.68 2.26 1.81.25.03 1.33.03 1.58 0 .92-.1 1.72-.61 2.08-1.31.09-.19.14-.31.18-.5.03-.14.04-.19.04-.44s0-.3-.04-.44c-.24-1.07-1.28-1.92-2.56-2.08-.17-.02-.6-.04-.71-.03Zm.54.78c.43.05.86.2 1.2.43.19.12.45.38.56.55.14.21.22.42.25.68.02.12 0 .21-.04.4-.07.29-.28.59-.56.8-.13.1-.41.24-.57.29-.32.1-.53.12-1.27.11-.49 0-.57 0-.71-.03-.48-.09-.85-.28-1.12-.57-.22-.23-.32-.45-.38-.79-.02-.16.02-.42.11-.65.11-.27.41-.61.7-.8.34-.22.78-.38 1.18-.43.16-.02.49-.02.64 0Z"/><path d="M11.45 12.22c-.11.06-.19.21-.16.32.03.12.13.24.29.34.09.05.09.06.1.11 0 .03 0 .12-.02.2a1 1 0 0 0-.03.19c0 .06.06.16.12.21.05.04.06.04.21.05.14 0 .17 0 .22-.02.14-.07.18-.2.12-.44-.04-.2-.03-.23.07-.3.11-.07.23-.18.27-.26.07-.15 0-.32-.15-.4a.3.3 0 0 0-.15-.03c-.1 0-.17.02-.3.1l-.07.04-.04-.03c-.18-.11-.22-.12-.33-.12-.08 0-.12 0-.16.03ZM7.96 10.55a.86.86 0 0 0-.54.53c-.05.13-.07.33-.05.43.05.26.26.49.5.56.3.08.53.03.73-.17a.85.85 0 0 0 .24-.37c.05-.11.05-.13.05-.29v-.17l-.06-.12c-.1-.2-.27-.34-.47-.39a.86.86 0 0 0-.39 0ZM15.63 10.55c-.2.05-.37.2-.47.39l-.06.12v.17c0 .16 0 .18.05.29.06.16.13.26.24.37.2.2.43.25.73.17.17-.05.35-.19.43-.36.07-.15.09-.25.07-.41-.05-.38-.27-.65-.6-.75a.86.86 0 0 0-.39 0Z"/>
        </svg>
    ),
    // Qwen — Alibaba Cloud purple
    qwen25: (
        <svg className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M268.885 28.587a9886.443 9886.443 0 0125.046 44.266 3.833 3.833 0 003.349 1.942h118.443c3.712 0 6.869 2.346 9.514 6.976l31.019 54.826c4.053 7.19 5.12 10.198.512 17.856a1129.453 1129.453 0 00-16.213 27.734l-7.83 14.037c-2.261 4.181-4.757 5.973-.853 10.923l56.576 98.922c3.669 6.422 2.368 10.539-.917 16.427a2813.646 2813.646 0 01-28.48 49.92c-3.392 5.803-7.51 8-14.507 7.893a916.763 916.763 0 00-49.643.342 2.12 2.12 0 00-1.728 1.066 12257.343 12257.343 0 01-57.706 101.12c-3.606 6.251-8.107 7.744-15.467 7.766-21.269.064-42.709.085-64.363.042a11.45 11.45 0 01-9.92-5.781l-28.48-49.557a1.919 1.919 0 00-1.77-1.046H106.283c-6.08.64-11.798-.021-17.174-1.962l-34.197-59.094a11.58 11.58 0 01-.043-11.52l25.75-45.226a4.225 4.225 0 000-4.203 11754.482 11754.482 0 01-40-69.803l-16.854-29.76c-3.413-6.613-3.69-10.581 2.027-20.586 9.92-17.344 19.776-34.667 29.59-51.968 2.815-4.992 6.485-7.126 12.458-7.147 18.41-.078 36.821-.085 55.232-.021a2.651 2.651 0 002.283-1.344L185.216 27.2a10.412 10.412 0 019.003-5.248c11.178-.021 22.464 0 33.77-.128l21.696-.49c7.275-.065 15.446.682 19.2 7.253zm-73.216 8.597a1.281 1.281 0 00-1.109.64l-61.141 106.987a3.347 3.347 0 01-2.88 1.664H69.397c-1.194 0-1.493.533-.874 1.578l123.946 216.662c.534.896.278 1.322-.725 1.344l-59.627.32a4.647 4.647 0 00-4.266 2.474l-28.16 49.28c-.939 1.664-.448 2.518 1.45 2.518l121.942.17c.981 0 1.706.427 2.218 1.302l29.931 52.352c.981 1.728 1.963 1.749 2.965 0l106.795-186.88 16.704-29.483a1.169 1.169 0 011.024-.601 1.17 1.17 0 011.024.601l30.379 53.973a2.599 2.599 0 002.282 1.323l58.944-.427a.846.846 0 00.858-.853.877.877 0 00-.111-.427L414.229 203.2a2.31 2.31 0 010-2.411l6.251-10.816 23.893-42.176c.512-.874.256-1.322-.746-1.322h-247.36c-1.259 0-1.558-.555-.918-1.643l30.592-53.44a2.276 2.276 0 000-2.432L196.8 37.845a1.276 1.276 0 00-1.131-.661zm134.187 171.093c.981 0 1.237.427.725 1.28l-17.749 31.254-55.744 97.813a1.199 1.199 0 01-1.067.619 1.242 1.242 0 01-1.066-.619l-73.664-128.683c-.427-.725-.214-1.109.597-1.152l4.608-.256 143.403-.256h-.043z" fill="url(#prefix__paint0_linear_9_19)"/><defs><linearGradient id="prefix__paint0_linear_9_19" x1="21.323" y1="21.33" x2="46955.3" y2="21.33" gradientUnits="userSpaceOnUse"><stop stopColor="#6336E7" stopOpacity=".84"/><stop offset="1" stopColor="#6F69F7" stopOpacity=".84"/></linearGradient></defs>
        </svg>
    ),
};

const MODEL_LABELS = {
    llama3: 'Llama 3',
    gpt4o_mini: 'GPT-4o',
    gemini_flash: 'Gemini',
    qwen25: 'Qwen 2.5',
};

// Provider badge colours for each service
const PROVIDER_BADGE = {
    llama3:       { label: 'Groq',        color: 'bg-pink-200' },
    gpt4o_mini:   { label: 'OpenAI',      color: 'bg-yellow-200' },
    gemini_flash: { label: 'Google',      color: 'bg-green-200' },
    qwen25:       { label: 'HuggingFace', color: 'bg-blue-100' },
};



const CATEGORY_EMOJIS = {
    coding: '💻', business: '📊', marketing: '📣', legal: '⚖️',
    education: '📚', productivity: '⚡', content_creation: '✍️',
    data_analysis: '📈', creative: '🎨', general: '🌐',
};

const getAgentIcon = (service) => {
    if (!service) return <span className="text-lg">✨</span>;
    if (!service.is_community) return MODEL_ICONS[service.id] || <span className="text-lg">✨</span>;
    
    const provider = (service.provider || '').toLowerCase();
    const model = (service.model || '').toLowerCase();
    
    if (provider.includes('openai') || model.includes('gpt')) return MODEL_ICONS['gpt4o_mini'];
    if (provider.includes('gemini') || provider.includes('google') || model.includes('gemini')) return MODEL_ICONS['gemini_flash'];
    if (provider.includes('groq') || model.includes('llama')) return MODEL_ICONS['llama3'];
    if (provider.includes('huggingface') || model.includes('qwen') || provider.includes('alibaba')) return MODEL_ICONS['qwen25'];
    
    return <span className="text-lg">✨</span>;
};

const QUICK_PROMPTS = [
    'Explain the significance of the Turing Test.',
    'Write a Python script to scrape a website.',
    'Draft a professional email to a client.',
];

const ALGOD_API = 'https://testnet-api.algonode.cloud';

const formatMicroAlgo = (microAlgo) => (Number(microAlgo || 0) / 1_000_000).toFixed(3);

const WorkspacePage = () => {
    const navigate = useNavigate();
    const { serviceId } = useParams();
    const { signOut } = useSiwa();
    const wallet = sessionStorage.getItem('wallet_address');
    const messagesEndRef = useRef(null);
    const peraWalletRef = useRef(null);
    const isStartingSessionRef = useRef(false);
    const isEndingSessionRef = useRef(false);

    const [service, setService] = useState(null);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [totalTokens, setTotalTokens] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [history, setHistory] = useState([]);
    const [payingStatus, setPayingStatus] = useState('');
    const [sessionStatus, setSessionStatus] = useState('inactive'); // inactive, active, expired
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [sessionBalance, setSessionBalance] = useState(0);
    const [, setTick] = useState(0); // Used to force re-render for countdown
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);

    const [randomPrompts, setRandomPrompts] = useState([]);
    
    const ALL_SUGGESTED_PROMPTS = useMemo(() => [
        { text: 'Write a to-do list for a personal project or task', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { text: 'Generate an email to reply to a job offer', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
        { text: 'Summarise this article or text for me in one paragraph', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
        { text: 'How does AI work in a technical capacity', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
        { text: 'Explain the significance of the Turing Test', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { text: 'Write a Python script to scrape a website', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
        { text: 'Draft a professional email to a client', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
        { text: 'Give me a recipe using chicken and broccoli', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
    ], []);

    const handleRefreshPrompts = useCallback(() => {
        const shuffled = [...ALL_SUGGESTED_PROMPTS].sort(() => 0.5 - Math.random());
        setRandomPrompts(shuffled.slice(0, 4));
    }, [ALL_SUGGESTED_PROMPTS]);

    useEffect(() => {
        handleRefreshPrompts();
    }, [handleRefreshPrompts]);

    const [isMinting, setIsMinting] = useState(false);
    const [mintedAssetId, setMintedAssetId] = useState(null);
    const [isOptingIn, setIsOptingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [keyProvider, setKeyProvider] = useState('gemini');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [keyStatusList, setKeyStatusList] = useState([]);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [keySuccessMessage, setKeySuccessMessage] = useState('');
    const [keyErrorMessage, setKeyErrorMessage] = useState('');

    const fetchKeyStatus = async () => {
        try {
            const status = await getApiKeyStatus(wallet);
            setKeyStatusList(status.keys || []);
        } catch (e) {
            console.error('Failed to load API key status:', e);
        }
    };

    useEffect(() => {
        if (isApiKeyModalOpen && wallet) {
            fetchKeyStatus();
        }
    }, [isApiKeyModalOpen, wallet]);

    const handleSaveWorkspaceKey = async () => {
        if (!apiKeyInput.trim()) return;
        // Always save to the agent's actual provider
        const agentProvider = service?.provider || 'gemini';
        setIsSavingKey(true);
        setKeySuccessMessage('');
        setKeyErrorMessage('');
        try {
            try {
                await getCreatorProfile(wallet);
            } catch (pErr) {
                await createCreatorProfile(wallet, 'Creator', 'AI Agent Creator');
            }

            await saveCreatorApiKey(wallet, agentProvider, apiKeyInput.trim());
            setApiKeyInput('');
            await fetchKeyStatus();
            const providerLabel = agentProvider.charAt(0).toUpperCase() + agentProvider.slice(1);
            setKeySuccessMessage(`${providerLabel} API key updated! Your agent will now use the new key.`);
            // Also clear any existing error in chat since key was fixed
            setError(null);
            setTimeout(() => {
                setKeySuccessMessage('');
                setIsApiKeyModalOpen(false);
            }, 2500);
        } catch (e) {
            setKeyErrorMessage(e.message || 'Failed to save key. Please try again.');
        } finally {
            setIsSavingKey(false);
        }
    };

    const [userProfile, setUserProfile] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [isCreator, setIsCreator] = useState(false);



    useEffect(() => {
        if (!wallet) {
            navigate('/');
            return;
        }

        // Reset chat states to open in a fresh new chat when entering a model/agent directly!
        const queryParams = new URLSearchParams(window.location.search);
        const sessionParam = queryParams.get('session');
        if (!sessionParam) {
            setConversationId(null);
            setMessages([]);
        }

        setServiceLoading(true);
        if (serviceId && serviceId.startsWith('agent_')) {
            getAgentDetails(serviceId)
                .then((agent) => {
                    const mapped = {
                        id: agent.agent_id,
                        name: agent.name,
                        description: agent.description,
                        category: agent.category,
                        provider: agent.provider,
                        model: agent.model,
                        price_algo: agent.pricing_model === 'per_request' ? agent.price_per_request_microalgo / 1_000_000 : 0.001,
                        price_microalgo: agent.pricing_model === 'per_request' ? agent.price_per_request_microalgo : 1000,
                        example_prompt: 'Hello! What can you do?',
                        is_community: true,
                        pricing_model: agent.pricing_model,
                        price_input_microalgo: agent.price_input_microalgo,
                        price_output_microalgo: agent.price_output_microalgo,
                        creator_wallet: agent.creator_wallet,
                        creator_name: agent.creator_name,
                    };
                    setService(mapped);
                    getServices().then(setAllServices).catch(() => {});
                })
                .catch((err) => {
                    console.error('Failed to load agent details:', err);
                    setError('AI Agent not found or inactive');
                })
                .finally(() => setTimeout(() => setServiceLoading(false), 2500));
        } else {
            getServices()
                .then((services) => {
                    setAllServices(services);
                    if (services.length > 0) {
                        const matchedService = serviceId ? services.find(s => s.id === serviceId) : null;
                        setService(matchedService || services[0]);
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch services:', err);
                    setService({
                        id: 'llama3',
                        name: 'Llama 3.3 (Groq)',
                        description: 'Lightning-fast general purpose reasoning model powered by Groq.',
                        price_algo: 0.1,
                        price_microalgo: 100000,
                        example_prompt: 'Explain the significance of the Turing Test.',
                    });
                })
                .finally(() => setTimeout(() => setServiceLoading(false), 2500));
        }
    }, [wallet, navigate, serviceId]);

    const checkSessionStatus = useCallback(async () => {
        if (!wallet || !paymentInfo?.app_id) return;
        try {
            const algosdk = (await import('algosdk')).default;
            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const appId = parseInt(paymentInfo.app_id);
            try {
                const seBoxName = new Uint8Array([
                    ...new TextEncoder().encode('se_'),
                    ...algosdk.decodeAddress(wallet).publicKey,
                ]);
                const sbBoxName = new Uint8Array([
                    ...new TextEncoder().encode('sb_'),
                    ...algosdk.decodeAddress(wallet).publicKey,
                ]);

                const [seBox, sbBox] = await Promise.all([
                    client.getApplicationBoxByName(appId, seBoxName).do(),
                    client.getApplicationBoxByName(appId, sbBoxName).do()
                ]);

                const expiry = Number(algosdk.decodeUint64(seBox.value, 'safe'));
                const balance = Number(algosdk.decodeUint64(sbBox.value, 'safe'));
                const now = Math.floor(Date.now() / 1000);
                
                setSessionExpiry(expiry);
                setSessionBalance(balance);
                
                // Require at least 5000 microAlgos to be considered 'active'
                if (expiry > now && balance > 5000) {
                    setSessionStatus('active');
                    return true;
                } else if (expiry <= now) {
                    setSessionStatus('expired');
                    return false;
                } else {
                    setSessionStatus('limit_exceeded');
                    return false;
                }
            } catch (e) {
                console.error('Inner session check failed (expected if inactive):', e);
                setSessionStatus('inactive');
                return false;
            }
        } catch (err) {
            console.error('Session check failed:', err);
        }
    }, [wallet, paymentInfo]);

    useEffect(() => {
        if (!service || !wallet) return;
        getPaymentInfo(service.id).then((info) => {
            setPaymentInfo(info);
        }).catch(() => {});
        getConversationHistory(wallet, null).then(setHistory).catch(() => {});
        getUserProfile(wallet).then(setUserProfile).catch(() => {});
        getUserAnalytics(wallet).then(setUserAnalytics).catch(() => {});
        // Check if user has agents
        getCreatorAgents(wallet).then(res => {
            setIsCreator((res.agents || []).length > 0);
        }).catch(() => setIsCreator(false));
    }, [service, wallet]);

    useEffect(() => {
        if (!paymentInfo) return;
        checkSessionStatus();
        const interval = setInterval(() => {
            checkSessionStatus();
        }, 15000); // Check on-chain status every 15 seconds
        return () => clearInterval(interval);
    }, [paymentInfo, checkSessionStatus]);

    const loadConversation = useCallback(
        async (convId) => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getConversationMessages(wallet, convId);
                setConversationId(convId);
                setMessages(data.messages || []);
                setTotalTokens(data.total_tokens || 0);
                setTotalCost(data.total_cost_usd || 0);
                setIsSidebarOpen(false);

                const u = new URL(window.location);
                u.searchParams.set('session', convId);
                window.history.pushState({}, '', u);

                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } catch (e) {
                setError(`Failed to load session: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        },
        [wallet]
    );

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const sessionParam = queryParams.get('session');
        if (sessionParam && sessionParam !== conversationId && !isLoading && wallet) {
            loadConversation(sessionParam);
        }
    }, [location.search, wallet, conversationId, isLoading, loadConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const usageRows = useMemo(() => {
        if (!history.length) {
            return [];
        }

        return history.map((item, index) => {
            let labelText = item.title || '';
            if (labelText.length > 25) {
                labelText = labelText.slice(0, 23) + '...';
            }
            if (!labelText) {
                labelText = item.service_name || `${service?.name || 'AI'} Session`;
            }

            return {
                id: item.conversation_id || index,
                label: labelText,
                tokens: item.total_tokens || 0,
                cost: item.total_cost_usd || 0,
                date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
                conversationId: item.conversation_id,
                serviceId: item.service_id,
            };
        });
    }, [history, service]);

    const marketplaceRows = useMemo(() => {
        return usageRows.filter(row => row.serviceId && row.serviceId.startsWith('agent_'));
    }, [usageRows]);

    const generalRows = useMemo(() => {
        return usageRows.filter(row => !row.serviceId || !row.serviceId.startsWith('agent_'));
    }, [usageRows]);

    const remainingTime = useMemo(() => {
        if (!sessionExpiry || sessionStatus !== 'active') return '';
        const now = Math.floor(Date.now() / 1000);
        const diff = sessionExpiry - now;
        if (diff <= 0) return 'Expiring...';
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m left`;
        return `${mins}m left`;
    }, [sessionExpiry, sessionStatus]);

    // Helper to convert raw blockchain/wallet errors into user-friendly messages
    const friendlyError = (e) => {
        let msg = '';
        if (typeof e === 'string') msg = e.toLowerCase();
        else if (e?.message) msg = e.message.toLowerCase();
        else {
            try { msg = JSON.stringify(e).toLowerCase(); } catch (_) { msg = 'unknown error'; }
        }
        
        if (msg.includes('cancel') || msg.includes('rejected') || msg.includes('declined'))
            return 'Transaction cancelled. You can try again anytime.';
        if (msg.includes('wallet mismatch'))
            return 'Wrong wallet connected. Please reconnect the correct one.';
        if (msg.includes('insufficient') || msg.includes('below min'))
            return 'Not enough ALGO. Please top up your wallet and try again.';
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout'))
            return 'Network error. Please check your connection and try again.';
        if (msg.includes('logic eval') || msg.includes('opcode'))
            return 'Smart contract rejected the transaction. Session may already be active or funds already withdrawn.';
        return 'Something went wrong. Please try again.';
    };

    const handleStartSession = async () => {
        if (isStartingSessionRef.current) return;
        isStartingSessionRef.current = true;
        try {
            setIsStartingSession(true);
            setError(null);

            const algosdk = (await import('algosdk')).default;
            const pw = peraWallet;

            let accounts = [];
            try { accounts = await pw.reconnectSession(); } catch (_) {}
            if (!accounts || !accounts.length) accounts = await pw.connect();
            if (accounts[0] !== wallet) throw new Error('Wallet mismatch');

            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await client.getTransactionParams().do();
            const appId = parseInt(paymentInfo.app_id);

            const sessionMethod = new algosdk.ABIMethod({
                name: 'start_session',
                args: [{ type: 'uint64', name: 'max_spend' }, { type: 'uint64', name: 'expiry_time' }],
                returns: { type: 'bool' },
            });
            const depositMethod = new algosdk.ABIMethod({
                name: 'deposit',
                args: [{ type: 'pay', name: 'payment' }],
                returns: { type: 'uint64' },
            });

            const expiryTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
            const depositAmount = 1000000;
            const maxSpend = (paymentInfo?.balance_microalgo || 0) + depositAmount;
            const dummySigner = algosdk.makeBasicAccountTransactionSigner({ addr: wallet, sk: new Uint8Array(64) });
            const atc = new algosdk.AtomicTransactionComposer();

            const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: paymentInfo.contract_address,
                amount: depositAmount,
                suggestedParams: params,
            });

            atc.addMethodCall({
                appID: appId, method: depositMethod,
                methodArgs: [{ txn: payTxn, signer: dummySigner }],
                sender: wallet, suggestedParams: params, signer: dummySigner,
                boxes: [{ appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) }],
            });
            atc.addMethodCall({
                appID: appId, method: sessionMethod,
                methodArgs: [maxSpend, expiryTime],
                sender: wallet, suggestedParams: params, signer: dummySigner,
                boxes: [
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                ],
            });

            const group = atc.buildGroup().map(t => t.txn);
            let signed;
            try {
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Initial session sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            }

            setPayingStatus('Sending to Algorand...');
            const { txId } = await client.sendRawTransaction(signed).do();

            setPayingStatus('Confirming on-chain...');
            await algosdk.waitForConfirmation(client, txId, 10);

            // Set active states immediately so the UI updates instantly
            setSessionStatus('active');
            setSessionBalance(maxSpend);
            setSessionExpiry(expiryTime);
            setPayingStatus('Session active! ✅');

            setTimeout(() => {
                setPayingStatus('');
                setIsSessionModalOpen(false);
            }, 1500);

            // Sync with blockchain after 3 seconds once the block is fully committed and indexers catch up
            setTimeout(() => {
                checkSessionStatus().catch(() => {});
            }, 3000);

        } catch (e) {
            console.error('Session start failed:', e);
            
            // Failsafe: even if Pera throws an error after user allows request,
            // let's do a quick check if the session actually went active.
            try {
                const isActive = await checkSessionStatus();
                if (isActive) {
                    setIsSessionModalOpen(false);
                    setPayingStatus('');
                    setError(null);
                    return;
                }
            } catch (innerErr) {}

            let msg = '';
            if (typeof e === 'string') msg = e.toLowerCase();
            else if (e?.message) msg = e.message.toLowerCase();
            else {
                try { msg = JSON.stringify(e).toLowerCase(); } catch (_) { msg = ''; }
            }

            if (msg.includes('timeout') || msg.includes('confirmation took too long')) {
                setSessionStatus('active');
                setSessionBalance(maxSpend);
                setSessionExpiry(expiryTime);
                setIsSessionModalOpen(false);
                setPayingStatus('');
            } else {
                setError(friendlyError(e));
                setPayingStatus('');
            }
        } finally {
            setIsStartingSession(false);
            isStartingSessionRef.current = false;
        }
    };

    const handleEndSessionAndWithdraw = async () => {
        if (isEndingSessionRef.current) return;
        isEndingSessionRef.current = true;
        try {
            setIsStartingSession(true);
            setError(null);
            const algosdk = (await import('algosdk')).default;
            const pw = peraWallet;
            let accounts = [];
            try { accounts = await pw.reconnectSession(); } catch (_) {}
            if (!accounts.length) accounts = await pw.connect();

            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await client.getTransactionParams().do();
            const appId = parseInt(paymentInfo.app_id);

            const method = new algosdk.ABIMethod({
                name: 'end_session_and_withdraw',
                args: [], returns: { type: 'uint64' },
            });

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({ addr: wallet, sk: new Uint8Array(64) });
            const atc = new algosdk.AtomicTransactionComposer();
            const doubleFeeParams = { ...params, fee: 2000, flatFee: true };

            atc.addMethodCall({
                appID: appId, method, methodArgs: [],
                sender: wallet, suggestedParams: doubleFeeParams, signer: dummySigner,
                accounts: [wallet],
                boxes: [
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                ],
            });

            const group = atc.buildGroup().map(t => t.txn);
            let signed;
            try {
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Initial refund sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            }

            setPayingStatus('Processing refund...');
            const { txId } = await client.sendRawTransaction(signed).do();

            // Set states immediately & close modal so user feedback is instant
            setSessionStatus('inactive');
            setSessionBalance(0);
            setIsSessionModalOpen(false);
            setPayingStatus('Refund successful! Session ended. 💸');
            
            setTimeout(() => {
                setPayingStatus('');
            }, 2500);

            // Wait for confirmation & sync in the background
            (async () => {
                try {
                    await algosdk.waitForConfirmation(client, txId, 6);
                } catch (confErr) {
                    console.warn('Background refund confirmation check warning:', confErr);
                }
                checkSessionStatus().catch(() => {});
            })();

        } catch (e) {
            console.error('Refund failed:', e);
            // If the transaction actually succeeded but confirmation timed out, don't show error
            if (e.message?.includes('timeout') || e.message?.includes('Confirmation took too long')) {
                setSessionStatus('inactive');
                setSessionBalance(0);
                setIsSessionModalOpen(false);
                setPayingStatus('');
            } else {
                setError(friendlyError(e));
                setPayingStatus('');
            }
        } finally {
            setIsStartingSession(false);
            isEndingSessionRef.current = false;
        }
    };


    const handleOptIn = async (assetId) => {
        try {
            setIsOptingIn(true);
            setError(null);
            const algosdk = (await import('algosdk')).default;

            const pw = peraWallet;
            let accounts = [];
            try {
                accounts = await pw.reconnectSession();
            } catch (_) {}
            if (!accounts || !accounts.length) accounts = await pw.connect();

            const algodClient = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await algodClient.getTransactionParams().do();

            const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: wallet,
                amount: 0,
                assetIndex: parseInt(assetId),
                suggestedParams: params,
            });

            let signed;
            try {
                signed = await pw.signTransaction([[{ txn, signers: [wallet] }]]);
            } catch (signErr) {
                console.warn('Initial opt-in sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([[{ txn, signers: [wallet] }]]);
            }
            await algodClient.sendRawTransaction(signed).do();
            await algosdk.waitForConfirmation(algodClient, txn.txID().toString(), 4);

            return true;
        } catch (e) {
            setError(`Opt-in failed: ${e.message}`);
            return false;
        } finally {
            setIsOptingIn(false);
        }
    };

    const handleMintNFT = async (imageUrl, promptText) => {
        try {
            setIsMinting(true);
            setError(null);

            const result = await mintNFT(wallet, imageUrl, promptText);
            const assetId = result.asset_id;

            setPayingStatus(`NFT created! Asset ID: ${assetId}. Please opt in from your wallet to receive it.`);
            const optedIn = await handleOptIn(assetId);

            if (optedIn) {
                setPayingStatus(`Transferring Asset ${assetId} to your wallet...`);
                await transferNFT(wallet, assetId);

                setMintedAssetId(assetId);
                setPayingStatus('NFT successfully sent to your wallet! ✨');
                setTimeout(() => setPayingStatus(''), 5000);
            }
        } catch (e) {
            setError(`Minting failed: ${e.message}`);
        } finally {
            setIsMinting(false);
        }
    };

    const handleSendPrompt = async (e) => {
        // Snapshot the model/service name at the exact moment the user sends
        // so that even if the user switches service mid-stream, old bubbles keep correct label
        const modelUsed = service?.name || service?.id || 'AI';
        e.preventDefault();
        if (!prompt.trim() || isLoading || !service) return;

        const userPrompt = prompt.trim();
        setPrompt('');
        setError(null);
        setIsLoading(true);
        setPayingStatus(
            service.id === 'image_studio'
                ? `Generating image...`
                : `Running ${service?.name || 'AI'}...`
        );
        setMessages((prev) => [...prev, { role: 'user', content: userPrompt, tokens_used: 0, cost_usd: 0, model: 'You' }]);

        try {
            if (service.id === 'image_studio') {
                const result = await generateImage(wallet, userPrompt, conversationId);
                setConversationId(result.conversation_id);
                const updated = await getConversationMessages(wallet, result.conversation_id);
                setMessages(updated.messages || []);
            } else {
                const res = service.is_community
                    ? await chatWithAgent(service.id, wallet, userPrompt, conversationId)
                    : await streamChat(service.id, wallet, userPrompt, conversationId, null);
                
                // Add a placeholder message for the assistant — tag with snapshotted model name
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: '', tokens_used: 0, cost_usd: 0, model: modelUsed }
                ]);
                
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    const chunkStr = decoder.decode(value, { stream: true });
                    const lines = chunkStr.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            if (!dataStr) continue;
                            
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.error || data.type === 'error') {
                                    throw new Error(data.error || data.message || 'Stream error');
                                }
                                
                                const textChunk = data.chunk || (data.type === 'text' ? data.content : '');
                                if (textChunk) {
                                    fullText += textChunk;
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        newMsgs[newMsgs.length - 1].content = fullText;
                                        return newMsgs;
                                    });
                                }
                                
                                if (data.done || data.type === 'done') {
                                    const convId = data.conversation_id || conversationId;
                                    setConversationId(convId);
                                    if (service.is_community) {
                                        const updated = await getConversationMessages(wallet, convId);
                                        const serverMsgs = updated.messages || [];
                                        // Merge: server has no model field per-msg, so preserve snapshotted labels
                                        setMessages(prev => serverMsgs.map((sm, i) => ({
                                            ...sm,
                                            model: sm.model || prev[i]?.model || (sm.role === 'assistant' ? modelUsed : 'You')
                                        })));
                                        setTotalTokens(updated.total_tokens || 0);
                                        setTotalCost(updated.total_cost_usd || 0);
                                    } else {
                                        const serverMsgs = data.messages || [];
                                        setMessages(prev => serverMsgs.map((sm, i) => ({
                                            ...sm,
                                            model: sm.model || prev[i]?.model || (sm.role === 'assistant' ? modelUsed : 'You')
                                        })));
                                        setTotalTokens(data.total_tokens_session || 0);
                                        setTotalCost(data.total_cost_session || 0);
                                    }
                                }
                            } catch (e) {
                                if (dataStr.includes('"error"') || dataStr.includes('"message"')) {
                                    throw new Error(e.message || 'Stream error');
                                }
                            }
                        }
                    }
                }
            }

            getConversationHistory(wallet, null).then(setHistory).catch(() => {});
            checkSessionStatus().catch(() => {});
        } catch (err) {
            setError(err.message || 'Request failed');
            setMessages((prev) => prev.slice(0, -1));
            setPrompt(userPrompt);
        } finally {
            setIsLoading(false);
            setIsStartingSession(false);
            setPayingStatus('');
        }
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat history?')) return;
        try {
            await deleteConversation(id);
            if (conversationId === id) {
                setConversationId(null);
                setMessages([]);
            }
            // Refresh history and analytics
            getConversationHistory(wallet, null).then(setHistory).catch(() => {});
            getUserAnalytics(wallet).then(setUserAnalytics).catch(() => {});
        } catch (err) {
            setError('Failed to delete chat: ' + err.message);
        }
    };

    const Sidebar = ({ isMobile = false }) => (
        <div className="flex min-h-full flex-col bg-[#f9f9f9] text-gray-800">
            {/* Top Header matching main content header */}
            <div className={`flex shrink-0 items-center justify-between border-b border-black/5 px-3 h-[57px] ${isSidebarCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
                {!isSidebarCollapsed && (
                    <button 
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="flex flex-1 items-center gap-3 p-1.5 rounded-xl hover:bg-gray-200/50 transition-colors text-left min-w-0"
                    >
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                            {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate text-[13px] font-semibold text-gray-800">{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : 'User Profile'}</p>
                        </div>
                    </button>
                )}
                {isMobile ? (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm font-bold text-gray-500 transition-colors ml-auto"
                        aria-label="Close workspace menu"
                    >
                        ✕
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed(c => !c)}
                        className={`shrink-0 rounded-lg p-2 hover:bg-gray-200/70 transition-colors text-gray-400 hover:text-gray-700 ${isSidebarCollapsed ? '' : ''}`}
                        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={isSidebarCollapsed ? 'Expand' : 'Collapse'}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-3 md:p-4">
                <div className="flex flex-col gap-0.5 mb-6 border-b border-gray-200 pb-4">
                <button
                    type="button"
                    onClick={() => { navigate('/dashboard/marketplace'); if (isMobile) setIsSidebarOpen(false); }}
                    className={`w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-gray-600 hover:text-gray-900`}
                    title={isSidebarCollapsed ? 'Marketplace' : undefined}
                >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                    </svg>
                    {!isSidebarCollapsed && <span>Marketplace</span>}
                </button>
                {isCreator && (
                    <>
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/my-agents'); if (isMobile) setIsSidebarOpen(false); }}
                            className={`w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-gray-600 hover:text-gray-900`}
                            title={isSidebarCollapsed ? 'My Agents' : undefined}
                        >
                            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                            </svg>
                            {!isSidebarCollapsed && <span>My Agents</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/earnings'); if (isMobile) setIsSidebarOpen(false); }}
                            className={`w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-gray-600 hover:text-gray-900`}
                            title={isSidebarCollapsed ? 'Earnings' : undefined}
                        >
                            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            {!isSidebarCollapsed && <span>Earnings</span>}
                        </button>
                    </>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setMessages([]);
                            setConversationId(null);
                            navigate('/dashboard');
                            if (isMobile) setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-3'} py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 rounded-xl transition-all text-[13px] font-medium`}
                        title="Start a new chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        {!isSidebarCollapsed && <span>New Chat</span>}
                    </button>
                </div>
                {!isSidebarCollapsed && (
                    <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                    {/* Section 1: AI Marketplace History */}
                    {marketplaceRows.length > 0 && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 pl-2">Today</p>
                            </div>
                            <div className="space-y-1">
                                {marketplaceRows.map((row) => (
                                    <div key={row.id} className="relative group flex items-stretch">
                                        <button
                                            type="button"
                                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                            className={`w-full text-left px-2 py-1.5 text-[13px] rounded-lg transition-all pr-8 ${
                                                row.conversationId === conversationId 
                                                ? 'bg-gray-200/60 text-gray-900 font-medium' 
                                                : 'text-gray-600 hover:bg-gray-200/50'
                                            }`}
                                        >
                                            <span className="block truncate pr-6">{row.label}</span>
                                            <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-normal opacity-60">
                                                <span>{row.tokens} tokens</span>
                                                <span>${Number(row.cost).toFixed(4)}</span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteConversation(e, row.conversationId)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md flex items-center justify-center"
                                            title="Delete Chat"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 2: General History */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2 mt-4">
                            <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 pl-2">Previous 7 Days</p>
                        </div>
                        <div className="space-y-1">
                            {generalRows.map((row) => (
                                <div key={row.id} className="relative group flex items-stretch">
                                    <button
                                        type="button"
                                        onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                        className={`w-full text-left px-2 py-1.5 text-[13px] rounded-lg transition-all pr-8 ${
                                            row.conversationId === conversationId 
                                            ? 'bg-gray-200/60 text-gray-900 font-medium' 
                                            : 'text-gray-600 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        <span className="block truncate pr-6">{row.label}</span>
                                        <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-normal opacity-60">
                                            <span>{row.tokens} tokens</span>
                                            <span>${Number(row.cost).toFixed(4)}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteConversation(e, row.conversationId)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md flex items-center justify-center"
                                        title="Delete Chat"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className={`w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                        title={isSidebarCollapsed ? 'Disconnect' : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                        {!isSidebarCollapsed && <span>Disconnect</span>}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );

    const MessageBubble = ({ msg, index }) => {
        const isUser = msg.role === 'user';
        const isImage = typeof msg.content === 'string' && msg.content.startsWith('[IMAGE]');
        const imageUrl = isImage ? msg.content.replace('[IMAGE]', '') : '';

        return (
            <div className={`flex animate-fadeUp ${isUser ? 'justify-end px-4 md:px-8' : 'justify-start px-4 md:px-8'} mb-6`}>
                <div
                    className={`max-w-full md:max-w-[80%] text-[15px] transition-all leading-relaxed ${
                        isUser ? 'bg-[#f4f4f4] rounded-[24px] px-5 py-3.5 text-gray-900' : 'bg-transparent py-2 text-gray-800'
                    }`}
                    style={{ animationDelay: `${index * 35}ms` }}
                >
                    {!isUser && (
                        <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                                {msg.model || 'AI'}
                            </span>
                        </div>
                    )}
                    {msg.tokens_used > 0 && !isImage && (
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[11px] font-medium text-gray-400">
                                {msg.tokens_used} tokens · ${msg.cost_usd ? msg.cost_usd.toFixed(6) : '0.000000'}
                            </span>
                        </div>
                    )}

                    {isImage ? (
                        <div className="space-y-4">
                            <img
                                src={imageUrl}
                                alt="Generated AI artwork"
                                className="w-full rounded-xl border border-black/10 object-cover shadow-sm"
                            />
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-green-50 text-green-700 border border-green-200 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-green-100 transition-colors"
                                >
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleMintNFT(imageUrl, messages[index - 1]?.content || 'AI image')}
                                    disabled={isMinting || isOptingIn}
                                    className="rounded-xl bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-purple-100 transition-colors disabled:opacity-50"
                                >
                                    {isMinting || isOptingIn ? 'Minting...' : 'Mint as NFT'}
                                </button>
                            </div>
                            {mintedAssetId && (
                                <p className="rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 text-xs font-semibold shadow-sm">
                                    Minted on Algorand Testnet: #{mintedAssetId}
                                </p>
                            )}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                            {msg.content}
                        </pre>
                    )}
                </div>
            </div>
        );
    };

    if (serviceLoading || !service) {
        return (
            <div className="min-h-screen bg-[#fdfdfd] pt-24 text-[#0a0a0a]">
                <div className="mx-auto flex min-h-[70vh] items-center justify-center">
                    <div className="w-56 h-56">
                        <DotLottieReact
                            src="https://lottie.host/897a2bc8-dc6b-481d-b7b3-f1728677a47d/giR3l29pyS.lottie"
                            loop
                            autoplay
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] overflow-hidden bg-white font-sans text-gray-800">
            {isSessionModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !isStartingSession && setIsSessionModalOpen(false)} />
                    <div className="animate-fadeUp relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                        {isStartingSession ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-5" />
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                                    {payingStatus || 'Action Required'}
                                </h3>
                                <p className="text-[13px] text-gray-500 max-w-[220px]">
                                    {payingStatus.includes('active') || payingStatus.includes('successful') 
                                        ? 'Your wallet balance has been updated.' 
                                        : 'Please approve the transaction in your Pera Wallet app.'}
                                </p>
                            </div>
                        ) : sessionStatus === 'active' ? (
                            <>
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                    <h2 className="text-[16px] font-semibold text-gray-900">Active Session</h2>
                                    <span className="rounded-full border border-green-200 bg-green-50 text-green-700 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="mb-5 space-y-2">
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Session Balance</p>
                                        <p className="text-2xl font-semibold text-gray-900">{formatMicroAlgo(sessionBalance)} <span className="text-sm font-normal text-gray-500">ALGO</span></p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Time Remaining</p>
                                        <p className="text-lg font-semibold text-gray-900">{remainingTime || 'Calculating…'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border border-gray-900 bg-gray-900 text-white py-2.5 text-[13px] font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        {isStartingSession ? 'Waiting…' : '+ Top Up 1 ALGO'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEndSessionAndWithdraw}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-2.5 text-[13px] font-medium text-gray-700 transition-colors"
                                    >
                                        {isStartingSession ? 'Processing…' : 'End Session & Refund'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Start Smart Session</h2>
                                <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                                    Approve a session to enable automatic micro-payments for 24 hours — no manual approval per message.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Not Now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border border-gray-900 bg-gray-900 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {isStartingSession ? 'Waiting…' : 'Approve'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                        aria-label="Close profile modal overlay"
                    />
                    <div className="animate-fadeUp relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                        {/* User header */}
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                            <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-[16px] text-gray-700">
                                {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold text-gray-900">{userProfile?.name || 'Anonymous User'}</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">{userProfile?.email || 'user@example.com'}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 mb-5">
                            <div className="rounded-xl border border-gray-200 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Tokens Used</p>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[11px] text-gray-400 mb-0.5">Last 30 Days</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.tokens_used_30d || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400 mb-0.5">Total Sessions</p>
                                        <p className="text-xl font-semibold text-gray-900">{userAnalytics?.total_sessions || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">ALGO Spent</p>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[11px] text-gray-400 mb-0.5">Last 30 Days</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.spent_algo_30d || 0).toFixed(2)} ALGO</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400 mb-0.5">Avg / Session</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.avg_algo_per_session || 0).toFixed(2)} ALGO</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsProfileModalOpen(false)}
                            className="w-full rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 p-2.5 text-[13px] font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        aria-label="Close workspace menu overlay"
                    />
                    <aside className="animate-slideIn relative w-[270px] overflow-y-auto border-r border-black/10 bg-white p-3 shadow-2xl">
                        <Sidebar isMobile />
                    </aside>
                </div>
            )}

            <div className={`grid h-full grid-cols-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:grid-cols-[64px_1fr]' : 'md:grid-cols-[260px_1fr]'}`}>
                <aside className="hidden overflow-y-auto border-r border-black/5 bg-white md:block transition-all duration-300">
                    <Sidebar />
                </aside>

                <main className="flex h-[100dvh] flex-col overflow-hidden relative">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-white/80 backdrop-blur-md p-3 md:px-6">
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm md:text-base">
                                <span className="text-base flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-gray-200 bg-white p-1.5">{getAgentIcon(service)}</span>
                                <span className="truncate font-bold text-gray-800">{service?.name || 'Workspace'}</span>
                                {service && (PROVIDER_BADGE[service.id] ? (
                                    <span className="hidden shrink-0 rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-[10px] font-semibold md:inline">
                                        {PROVIDER_BADGE[service.id].label}
                                    </span>
                                ) : service.is_community ? (
                                    <span className="hidden shrink-0 rounded-full bg-purple-50 text-purple-600 px-2.5 py-0.5 text-[10px] font-semibold md:inline">
                                        Community · {service.provider}
                                    </span>
                                ) : null)}
                                <span className="hidden text-gray-300 md:inline">•</span>
                                
                                {service?.is_community && service?.creator_wallet === wallet ? (
                                    <div 
                                        className="flex items-center gap-1.5 rounded-lg bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-bold cursor-default animate-pulse"
                                    >
                                        ✨ Creator Mode (Free)
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => setIsSessionModalOpen(true)}
                                        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                            sessionStatus === 'active' 
                                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
                                                : (sessionStatus === 'expired' || sessionStatus === 'limit_exceeded') 
                                                ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' 
                                                : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                                        }`}
                                    >
                                        <span className="hidden md:inline">Smart Session:</span>
                                        <span>
                                            {sessionStatus === 'active' 
                                                ? `Approved (${remainingTime})` 
                                                : sessionStatus === 'expired' 
                                                ? 'Expired' 
                                                : sessionStatus === 'limit_exceeded'
                                                ? 'Limit Reached'
                                                : 'Start Session'
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="relative rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-700 transition-colors md:hidden"
                            >
                                Menu
                            </button>
                        </div>
                    </div>

                    {(payingStatus || error) && (
                        <div
                            className={`mx-4 mt-4 shrink-0 rounded-xl p-3 text-sm font-medium border shadow-sm ${
                                error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <span className="text-lg">{error ? '🚫' : '⏳'}</span>
                                <span className="flex-1">{error || payingStatus}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    {error && service?.is_community && service?.creator_wallet === wallet && (
                                        error.toLowerCase().includes('api key') || error.toLowerCase().includes('api_key') ||
                                        error.toLowerCase().includes('quota') || error.toLowerCase().includes('expired') ||
                                        error.toLowerCase().includes('failed') || error.toLowerCase().includes('not found') ||
                                        error.toLowerCase().includes('429') || error.toLowerCase().includes('invalid')
                                    ) && (
                                        <button
                                            type="button"
                                            onClick={() => setIsApiKeyModalOpen(true)}
                                            className="rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 text-xs font-semibold hover:bg-yellow-200 transition-colors"
                                        >
                                            🔐 Update API Key
                                        </button>
                                    )}
                                    {error && (
                                        <button 
                                            type="button" 
                                            onClick={() => setError(null)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors" 
                                            aria-label="Dismiss error"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto p-2 pb-4 md:p-4">
                        {messages.length === 0 && !isLoading && service?.is_community ? (
                            <div className="flex flex-col min-h-full justify-center py-6 max-w-4xl mx-auto w-full px-4 md:px-8">
                                <div className="mb-12 animate-fadeUp">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 rounded-[14px] bg-white border border-gray-200/70 shadow-sm flex items-center justify-center p-2.5 text-3xl">
                                                {getAgentIcon(service)}
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-[24px] font-bold text-gray-900 leading-tight mb-0.5">{service.name}</h2>
                                            <p className="text-[14px] text-gray-400 font-medium flex items-center gap-1.5 capitalize">
                                                <span>{service.provider}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{service.model}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white text-gray-600 px-3 py-1.5 text-[12px] font-semibold">
                                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                            {service.creator_name || 'Creator'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#f0f4ff] text-blue-600 px-3 py-1.5 text-[12px] font-semibold">
                                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>
                                            {service.pricing_model === 'per_request' ? `${service.price_algo?.toFixed(2)} ALGO / req` : 'Per Token Billing'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-[#f8f4ff] text-purple-600 px-3 py-1.5 text-[12px] font-semibold capitalize">
                                            <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                                            {service.category?.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {service.description && (
                                        <p className="text-[15px] text-gray-500 leading-relaxed max-w-2xl">{service.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full animate-fadeUp delay-100 mb-6">
                                    {randomPrompts.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setPrompt(p.text)}
                                            className="rounded-2xl p-5 text-left transition-all border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 flex flex-col justify-between min-h-[130px] group shadow-sm hover:shadow-md"
                                        >
                                            <p className="text-[13px] font-medium text-gray-700 leading-relaxed mb-4 line-clamp-3">{p.text}</p>
                                            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                                {p.icon}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center animate-fadeUp delay-200">
                                    <button
                                        type="button"
                                        onClick={handleRefreshPrompts}
                                        className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Prompts
                                    </button>
                                </div>
                            </div>
                        ) : messages.length === 0 && !isLoading && (
                            <div className="flex flex-col min-h-full justify-center py-6 max-w-4xl mx-auto w-full px-4 md:px-8">
                                <div className="animate-fadeUp mb-12">
                                    <h2 className="text-[2.25rem] md:text-[2.75rem] font-medium text-gray-800 tracking-tight leading-[1.1] mb-6">
                                        Hi there, {userProfile?.name?.split(' ')[0] || (wallet ? wallet.slice(0,6) : 'User')}<br/>
                                        <span className="text-gray-900 font-bold">What would you like to know?</span>
                                    </h2>
                                    <p className="text-gray-500 text-[15px] leading-relaxed">Use one of the most common prompts<br className="hidden md:block" />below or use your own to begin</p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full animate-fadeUp delay-100 mb-6">
                                    {randomPrompts.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setPrompt(p.text)}
                                            className="rounded-2xl p-5 text-left transition-all border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 flex flex-col justify-between min-h-[130px] group shadow-sm hover:shadow-md"
                                        >
                                            <p className="text-[13px] font-medium text-gray-700 leading-relaxed mb-4 line-clamp-3">{p.text}</p>
                                            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                                {p.icon}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center animate-fadeUp delay-200">
                                    <button 
                                        type="button" 
                                        onClick={handleRefreshPrompts}
                                        className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Prompts
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <MessageBubble key={`${msg.role}-${index}-${msg.content?.slice?.(0, 12) || index}`} msg={msg} index={index} />
                        ))}

                        {isLoading && (
                            <div className="px-4 md:px-8">
                                <div className="w-fit text-sm text-gray-500 py-2">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                                        </span>
                                        {payingStatus || ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="sticky bottom-0 shrink-0 bg-transparent p-2 md:p-6 pb-6">
                        {(sessionStatus !== 'active' && service?.creator_wallet !== wallet) ? (
                        <div
                                onClick={() => setIsSessionModalOpen(true)}
                                className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all active:scale-[0.99] animate-fadeUp"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Session required</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Start a session to chat with this agent.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                >
                                    Start Session
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendPrompt} className="relative mx-auto w-full max-w-3xl bg-[#f4f4f4] rounded-[24px] border border-gray-200 p-1.5 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
                                <div className="flex flex-col">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={messages.length === 0 ? 'Message AI...' : 'Reply...'}
                                        className="min-h-[52px] max-h-40 w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] outline-none custom-scrollbar text-gray-800 placeholder-gray-500"
                                        disabled={isLoading}
                                        maxLength={2000}
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendPrompt(e);
                                            }
                                        }}
                                    />
                                    
                                    <div className="flex items-center justify-between px-2 pt-1 pb-1">
                                        <div className="flex items-center gap-1.5">
                                            {/* No quick prompts per user request */}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                        {service?.is_community ? (
                                            <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 px-3 text-[12px] font-medium md:flex">
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>
                                                {service.name.length > 16 ? service.name.slice(0, 14) + '…' : service.name}
                                            </div>
                                        ) : (
                                            <div className="relative hidden md:block">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                                    disabled={isLoading}
                                                    className={`h-8 flex items-center gap-2 cursor-pointer rounded-lg border bg-white pl-3 pr-2.5 text-[12px] font-medium text-gray-700 outline-none hover:border-gray-300 transition-colors ${isModelDropdownOpen ? 'border-gray-400 shadow-sm' : 'border-gray-200'}`}
                                                >
                                                    {service ? (MODEL_LABELS[service.id] || service.name) : 'Select Model'}
                                                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                
                                                {isModelDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                                                        <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeUp origin-bottom-right">
                                                            <div className="p-1.5 flex flex-col gap-0.5">
                                                                {allServices.filter(s => ['llama3', 'gpt4o_mini', 'gemini_flash', 'qwen25'].includes(s?.id)).map((s) => {
                                                                    const badge = PROVIDER_BADGE[s.id];
                                                                    return (
                                                                        <button
                                                                            key={s.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setService(s);
                                                                                setIsModelDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-[12px] transition-colors ${service?.id === s.id ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-80">{MODEL_ICONS[s.id]}</span>
                                                                                {MODEL_LABELS[s.id] || s.name}
                                                                            </span>
                                                                            {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badge.color} text-gray-800 font-semibold tracking-wide border border-black/5 shadow-sm`}>{badge.label}</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
     
                                        <button
                                            type="submit"
                                            disabled={isLoading || !prompt.trim()}
                                            className={`h-[34px] w-[34px] flex items-center justify-center rounded-full transition-all ${
                                                prompt.trim() && !isLoading 
                                                ? 'bg-black text-white hover:bg-gray-800' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                            )}
                                        </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>

            {/* Agent-specific API Key Update Modal — only shown to creator */}
            {isApiKeyModalOpen && service?.is_community && service?.creator_wallet === wallet && (() => {
                const agentProvider = service?.provider || 'gemini';
                const agentModel = service?.model || '';
                const existingKey = keyStatusList.find(k => k.provider === agentProvider);
                const providerLabel = {
                    gemini: 'Google Gemini', openai: 'OpenAI', groq: 'Groq', huggingface: 'HuggingFace',
                }[agentProvider] || agentProvider;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md animate-fadeUp rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                            <div className="mb-5 flex items-center justify-between pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                        Update API Key
                                    </h2>
                                    <p className="text-[12px] text-gray-400 mt-0.5">For agent: {service.name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {keySuccessMessage && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[13px] text-green-700">{keySuccessMessage}</div>
                            )}
                            {keyErrorMessage && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">{keyErrorMessage}</div>
                            )}

                            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Agent Configuration</p>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{providerLabel}</span>
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{agentModel}</span>
                                    <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5 ${existingKey ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${existingKey ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {existingKey ? `Key set (${existingKey.key_hint})` : 'No key saved'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                                    {providerLabel} API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder={`sk-... or AIza... — your ${agentProvider} key`}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-400 bg-white transition-colors"
                                    autoComplete="off"
                                />
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Encrypted with AES-256-GCM. Never stored in plaintext.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="flex-1 rounded-lg border border-gray-200 p-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingKey || !apiKeyInput.trim()}
                                    onClick={handleSaveWorkspaceKey}
                                    className="flex-1 rounded-lg border border-gray-900 bg-gray-900 p-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isSavingKey ? 'Saving…' : 'Save & Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <SidebarStyles />
        </div>
    );
};

function SidebarStyles() {
    return (
        <style>{`
            .animate-fadeUp {
                animation: fadeUp 0.25s ease-out;
            }

            @keyframes fadeUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .animate-slideIn {
                animation: slideIn 0.2s ease-out;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(-100%);
                }

                to {
                    transform: translateX(0);
                }
            }
        `}</style>
    );
}

export default WorkspacePage;
