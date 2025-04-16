import React from 'react';
import './goToProfileIcon.css';

export const MakePostIcon = (props) => {
    const style = {
        width: '32px',
        height: '32px',
        // Uncomment or add animation styles if needed:
        // transformOrigin: '0% 100%',
        // animation: 'rotateAnimation 3s linear infinite',
    };

    return (
        <svg width="41" height="40" viewBox="0 0 41 40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <rect width="41" height="40" fill="url(#pattern0_112_217)" />
            <defs>
                <pattern id="pattern0_112_217" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlink:href="#image0_112_217" transform="matrix(0.015625 0 0 0.0160156 0 -0.0125)" />
                </pattern>
                <image id="image0_112_217" width="64" height="64" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACm0lEQVR4Ae2aW3KDMAxFWRJp6HeX1qWxNDomNjGyZIwtydCoMxkeAUv36Fo4SYfB/oyAETACRsAIqBCYvsbf9fUclwl7+fdVktEK4gXPqGAMwvvc7O7VypM9zvfj8TM9xxrh0B2zG4s9QckBmYQnICRzZhv7QPxqa6yiq2NcD8i7ZmZLVGIgMvmKuZxplteEQIhvmr+ZPnItCJR4LpdJj9+Up6+SeMPCIGC9pElMzc1IYmL21IxVxAJrVJJVQd1W0WCLxJVclFREIRkEupjjDhnA5e3hDUwX9Iq7S79nJXo4byfeHSQAFOwfkugZO+QwQBtKNr8tqN/BmiG8RvwYAhAPCAL0jp84AOQnfmgA3l+crKtQceIwQO8K9I6fTIHPa4KvLy/eH4I+7jEIATxHtSXpJRZCrif0moe94sI+6ADsv/VVmAbJKlDReSmAdBosks0QWwE6IElimicSFwhWRDNWMUO0KgIQEPGibisG4C7EknPnTg2SuVh6/Ezo8reoJFt6gnfXvtG+lsBscMsVFlxJQFhqGhXS7cOi65riAx8Sgq+cE4a5Yq323X8aK4QQKnl2e+3KB/Fhe+CE/yk+07TOCqaub/qtMRSHfasgHAK5Dohiq7sGRzTAUJGtESJLbPgByB/36wu+6rAy8THL//j4xyG2FthiuVwCRJVt5hntkhKx5+E00/pQlLG8iHBY0QMQslOCFK9FP6KRcaEMBEq8+vyLIHg3bL0gapS8EAjxKpaP9KK7mSnBA4GgzDM4KqnuJFakZncS4pe6FOXviqbANi2aIIhQFeRAFKzOrViXbaIpKDweGoVQ85RC7FRHMs5OaR9z7unQEMDpATrf0Jx/bKU7WB/yvnv+UI8dGwEjYASMgBEwAvwE/gDYO+FEWRGMJQAAAABJRU5ErkJggg==" />
            </defs>
        </svg>

    );
};

export const PostMarkerIcon = (props) => {
    const style = {
        width: '32px',
        height: '32px',
        // Custom styling or animations specific to this icon.
    };

    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.51612 13.7096C10.9367 13.7096 13.7097 10.9367 13.7097 7.51606C13.7097 4.09546 10.9367 1.32251 7.51612 1.32251C4.09552 1.32251 1.32257 4.09546 1.32257 7.51606C1.32257 10.9367 4.09552 13.7096 7.51612 13.7096Z" stroke="#343330" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>


    );
};