export const getTopKeywords = (wordArrays) => {
  // Flatten the array of arrays into a single array of words
  const words = wordArrays.flat();

  // Create a word frequency map
  const wordFrequencyMap = new Map();

  for (const word of words) {
    const count = wordFrequencyMap.get(word) || 0;
    wordFrequencyMap.set(word, count + 1);
  }

  // Sort the words by frequency in descending order
  const sortedWords = Array.from(wordFrequencyMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  // Take the top 10 words with counts
  const topKeywordsWithCount = sortedWords.slice(0, 10).map((entry) => ({
    keyword: entry[0],
    count: entry[1],
  }));

  return topKeywordsWithCount;
};
