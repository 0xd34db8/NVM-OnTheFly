I have a suggestion on how we can make the app button faster, look at this log:

> nvm ls
->     v22.23.2
       v26.10.0
         system
default -> v22.23.2
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v26.10.0) (default)
stable -> 26.10 (-> v26.10.0) (default)
lts/* -> lts/krypton (-> N/A)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.12 (-> N/A)
lts/fermium -> v14.21.3 (-> N/A)
lts/gallium -> v16.20.2 (-> N/A)
lts/hydrogen -> v18.20.8 (-> N/A)
lts/iron -> v20.20.2 (-> N/A)
lts/jod -> v22.23.3 (-> N/A)
lts/krypton -> v24.21.0 (-> N/A)
---CURRENT---
v22.23.2


(idk if this is correct, but):
at launch, the app reads the ouput of nvm ls to display the ui correctly

why does it need the whole command output to finish?
why can't it just read '->     v22.23.2' and show the state?

2) look at this log:

> nvm use v26.10.0
default -> v26.10.0

> nvm ls
       v22.23.2
->     v26.10.0
         system
default -> v26.10.0
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v26.10.0) (default)
stable -> 26.10 (-> v26.10.0) (default)
lts/* -> lts/krypton (-> N/A)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.12 (-> N/A)
lts/fermium -> v14.21.3 (-> N/A)
lts/gallium -> v16.20.2 (-> N/A)
lts/hydrogen -> v18.20.8 (-> N/A)
lts/iron -> v20.20.2 (-> N/A)
lts/jod -> v22.23.3 (-> N/A)
lts/krypton -> v24.21.0 (-> N/A)
---CURRENT---
v26.10.0

Now, the 'default -> v26.10.0' output comes the fastest, which is followed by the slow

'
> nvm ls
       v22.23.2
->     v26.10.0
         system
default -> v26.10.0
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v26.10.0) (default)
stable -> 26.10 (-> v26.10.0) (default)
lts/* -> lts/krypton (-> N/A)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.12 (-> N/A)
lts/fermium -> v14.21.3 (-> N/A)
lts/gallium -> v16.20.2 (-> N/A)
lts/hydrogen -> v18.20.8 (-> N/A)
lts/iron -> v20.20.2 (-> N/A)
lts/jod -> v22.23.3 (-> N/A)
lts/krypton -> v24.21.0 (-> N/A)
---CURRENT---
v26.10.0'

the still waits for the whole ouput, while it can just read the 'default -> v26.10.0' and show the state


how does that sound?

==============================

I wanted to check if there will be any problems if I do other operations while the output has not fully ended, so I pressed the use button after the UI had quickly loaded:


> nvm ls
       v22.23.2
->     v26.10.0
         system
default -> v26.10.0
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v26.10.0) (default)
stable -> 26.10 (-> v26.10.0) (default)

> nvm use v22.23.2
lts/* -> lts/krypton (-> N/A)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.12 (-> N/A)
lts/fermium -> v14.21.3 (-> N/A)
lts/gallium -> v16.20.2 (-> N/A)
lts/hydrogen -> v18.20.8 (-> N/A)
lts/iron -> v20.20.2 (-> N/A)
lts/jod -> v22.23.3 (-> N/A)
lts/krypton -> v24.21.0 (-> N/A)
---CURRENT---
v26.10.0
default -> v22.23.2

> nvm ls
->     v22.23.2
       v26.10.0
         system
default -> v22.23.2
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v26.10.0) (default)
stable -> 26.10 (-> v26.10.0) (default)
lts/* -> lts/krypton (-> N/A)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.12 (-> N/A)
lts/fermium -> v14.21.3 (-> N/A)
lts/gallium -> v16.20.2 (-> N/A)
lts/hydrogen -> v18.20.8 (-> N/A)
lts/iron -> v20.20.2 (-> N/A)
lts/jod -> v22.23.3 (-> N/A)
lts/krypton -> v24.21.0 (-> N/A)
---CURRENT---
v22.23.2


I don't think there was a problem this time, but what do you think? can there be any problems?

also, the refresh button seems to be stuck on the loading state until the full output has been shown (the user can't click it until then), idk if thats good or bad, what do you think?