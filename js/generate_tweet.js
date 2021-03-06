// From https://stackoverflow.com/a/34064434
function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

function make_tweet_elements(tweet_info){
    let tweet_text = tweet_info.text;
    tweet_text = tweet_text.replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1" target="_blank">$&</a>');
    tweet_text = tweet_text.replace(/@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank">$&</a>');

    let template = document.getElementById("tweet-template");
    let clone = document.importNode(template.content, true);
    let container = clone.querySelector(".tweet");

    let text_container = container.querySelector(".tweet-content");
    text_container.innerHTML = tweet_text;

    let permalink = container.querySelector(".tweet-seed");

    if(tweet_info.modelKey){
        permalink.href = `s#${tweet_info.seed}:${tweet_info.modelKey}`;
    } else {
        permalink.href = `s#${tweet_info.seed}`;
    }

    return container;
}

function generateTweet(model, prng){

    function generateTokens(model){
        let end_index = model.items.indexOf("End");

        let output = [0];

        let current_symbols = [0];

        while(current_symbols[current_symbols.length - 1] != end_index){
            let next_set = model.symbols[current_symbols.map(n => n.toString()).join(" ")];

            let next_symbol = weightedChoose(next_set, prng);

            output.push(next_symbol);

            if(current_symbols.length == model.order){
                current_symbols.shift();
            }

            current_symbols.push(next_symbol);
        }

        return output;
    }

    function generateTextParts(model, tokens){
        let output = [];

        for(let token of tokens){
            let part = model.items[token];

            if(part.hasOwnProperty("Mid")){
                output.push(part["Mid"]);
            }
        }

        return output;
    }

    function isWord(o){
        return o.hasOwnProperty("Word");
    }

    function isPunctuation(o){
        return o.hasOwnProperty("Punctuation");
    }

    function generateText(textParts){
        let output = "";

        for(let i = 0; i < textParts.length; i++){
            let current_part = textParts[i];
            let next_part = textParts[i + 1] || {"End": ""};

            if(isWord(current_part)){
                let space_after = isWord(next_part) || (isPunctuation(next_part) && next_part["Punctuation"][1]);

                output += current_part["Word"] + (space_after?" ":"");
            } else if(isPunctuation(current_part)){
                let space_after = current_part["Punctuation"][2] && !(next_part.hasOwnProperty("End"));

                output += current_part["Punctuation"][0] + (space_after?" ":"");
            }
        }

        return output;
    }

    let tweet;

    do {
        tweet = generateText(generateTextParts(model, generateTokens(model)));
    } while(tweet.length > 280 || tweet.length == 0);

    return htmlDecode(tweet);    
}