## Overview

Canardist is a social deduction / secret identity game that can be played with any browser at [CANARDIST.COM](https://www.canardist.com). The game requires 5-10 players; each player must have their own device. I was inspired to make this game during the pandemic as a way to play games with friends in a virtual setting.

At its core, the game is about bluffing and reading people. Players are anonymously divided into two teams: red and black. Each player is given an identity card indicating which team they are on, but no one knows anyone else’s identity. The majority of players will always be on the black team.

In each round, players anonymously submit cards through a secret ballot. As the outcome of each round is revealed, players must piece together who is on which team. Players on the black team are trying to figure out which players on the red team. Red team players are trying to convince everyone they are on the black team.

The game was developed with Bootstrap, jQuery, & Pug on the front end; and Socket.io & Express on the back end. The playing cards are rendered with a library called [CardsJS](https://www.npmjs.com/package/cardsJS).
<br><br><br>


## Gameplay

The landing page provides a randomly generated ID to link other people to the game. You can also create your own custom ID. A short explanation of the rules can also be found here. Once the user navigates to the room and enters their name, they can take a brief tour of the dashboard if it's their first time playing.

![landing](https://user-images.githubusercontent.com/73765884/121802244-65d28700-cc09-11eb-9bac-4ea412883f89.png)
![finishTour](https://user-images.githubusercontent.com/73765884/121802249-666b1d80-cc09-11eb-8fa8-9f13d2cad3a6.png)
<br><br><br>

Once there are 5-10 people in the room, the action button will turn green indicating that a new game can start.

![joinNewGame](https://user-images.githubusercontent.com/73765884/121802242-65d28700-cc09-11eb-97c5-7e5a2f2777cf.png)
<br><br><br>


While the strategy is best understood by playing through a couple rounds, the gameplay itself is fairly self-explanatory. Whenever an action is required of a player, they are either prompted through a push notification or the action button will appear green. Notifications will also appear in the chat during the game.

![propModal](https://user-images.githubusercontent.com/73765884/121802245-65d28700-cc09-11eb-9c03-860735d5e76b.png)
![roundModal](https://user-images.githubusercontent.com/73765884/121802247-65d28700-cc09-11eb-8edd-cbc64d1c13e0.png)
<br><br><br>


While the game is in progress, the room is locked and will not admit new players. At the end of the game, everyone's identity cards are revealed to all players. Maybe everyone has a laugh, maybe you never trust your friend again. At this point the room is unlocked; new players can enter the room or a new game can start.

![gameInProgress](https://user-images.githubusercontent.com/73765884/121802240-6539f080-cc09-11eb-91fe-cc39c5cb1092.png)
![reveal](https://user-images.githubusercontent.com/73765884/121823109-1aec5a00-cc71-11eb-81ec-a888ce644454.png)
