import algosdk
from algosdk import mnemonic, wordlist

def find_missing():
    words_24 = "immense soap banana suggest naive wrap nation inhale exchange thunder tree hotel town cherry sound route marriage kidney veteran cost nature verb genius paper".split()
    wlist = wordlist.word_list_raw().split('\n')
    
    print(f"Searching for 25th word for 24-word sequence...")
    count = 0
    for insert_pos in range(25):
        for w in wlist:
            if not w: continue
            count += 1
            if count % 10000 == 0:
                print(f"Tested {count} combinations...")
            test_words = words_24[:insert_pos] + [w] + words_24[insert_pos:]
            test_m = " ".join(test_words)
            
            try:
                pk = mnemonic.to_private_key(test_m)
                addr = algosdk.account.address_from_private_key(pk)
                print(f"FOUND! Position {insert_pos+1}, Word '{w}' -> Address: {addr}")
                print(f"Mnemonic: {test_m}")
                # return # Keep searching in case of multiple valid ones (checksums)
            except Exception:
                pass

if __name__ == "__main__":
    find_missing()
