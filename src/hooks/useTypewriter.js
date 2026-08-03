import { useState, useEffect } from 'react';

/**
 * Custom hook to create a typewriter effect for placeholders
 * @param {string[]} words - Array of words to cycle through
 * @param {number} typingSpeed - Speed of typing in ms
 * @param {number} deletingSpeed - Speed of deleting in ms
 * @param {number} delayBetweenWords - Delay before deleting or switching words
 */
export function useTypewriter(
  words, 
  typingSpeed = 100, 
  deletingSpeed = 50, 
  delayBetweenWords = 2000
) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    if (isPaused) {
      const timer = setTimeout(() => {
        setIsPaused(false);
        setReverse(true);
      }, delayBetweenWords);
      return () => clearTimeout(timer);
    }

    if (subIndex === words[index].length + 1 && !reverse) {
      setIsPaused(true);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, isPaused, typingSpeed, deletingSpeed, delayBetweenWords]);

  return `${words[index].substring(0, subIndex)}${isPaused ? '' : '|'}`;
}
