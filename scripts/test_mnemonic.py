import algosdk

words_24 = "immense soap banana suggest naive wrap nation inhale exchange thunder tree hotel town cherry sound route marriage kidney veteran cost nature verb genius paper"
prefix = words_24.split()

from algosdk import wordlist
word_list = wordlist.word_list_raw().split("\n")

for word in prefix:
    if word not in word_list:
        print("TYPO FOUND:", word)

print("Check finished.")

