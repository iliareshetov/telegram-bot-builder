Telegram Bot implementation using [node-telegram-bot-api](https://www.npmjs.com/package/node-telegram-bot-api) library and [Yandex SpeechKit Cloud API](https://cloud.yandex.com/en/docs/speechkit/).    

The bot listens for incoming messages and responds based on the type of message received.  
If the **message is text**, the bot will use the Yandex API to **convert the text to speech** and send the result back to the user as an audio file.  
If the **message is a voice message**, the bot **will use the NLP service API to convert the voice to text** and check if user wants to create task to database.  

The bot has functionality to manage tasks with commands like "new", "update", and "delete".  
The tasks are stored in a PostgreSQL database.
