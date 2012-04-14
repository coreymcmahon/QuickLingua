"use strict";
/**
 * Datasource implements a basic iterator interface.
 */
var datasource = (function () {
	var config = {
		url: './data/spanish.csv'
	};
	var data = null;
	var counter = 0;

	/**
	 * Set the config object from outside the class
	 * @param _config Object containing the configuration values
	 * @public
	 */
	function setConfig(_config) {
		config = _config;
		data = null;
	}
	
	/**
	 * Loads the data file
	 * @public
	 */	
	function loadFile() {
		$.ajax({
			url: config.url,
			async: false,
			success: function (csv) {
				var lines = ('' + csv).split('\n');
				data = [];
				for (var i=1 ; i < lines.length ; i++) {
					// Ignore the first line, which contains the column names
					var values = lines[i].split(',');
					data[i-1] = {
						en: values[0],
						es: values[1]
					}
				}
			}
		});
	}

	/**
	 * Get the next element in the data file
	 * @public
	 * @return A string from the data file
	 */	
	function next() {
		if (!data) {
			loadFile();
		}
		counter++;
		return data[counter-1];
	}

	/**
	 * Fast forward to this element in the data file
	 * @public
	 */
	function setCounter(_counter) {
		counter = _counter;
	}

	/**
	 * Get a random element from the data file
	 * @public
	 * @return A string from the data file	
	 */
	function random() {
		if (!data) {
			loadFile();
		}
		return data[Math.floor(Math.random()*data.length)];
	}
	
	return {
		next: next,
		loadFile: loadFile,
		random: random,
		setCounter: setCounter
	};
} ());

/**
 *
 */
var languageTool = (function () {
	var datasource = null;
	var cardPile = null;
	var currentSessionCardStack = [];
	var dataPointer = 0;
	
	var config = {
		cardFactor: 0.9
	};

	/**
	 * Get a Date object a certain number of days, hours or minutes from now
	 * @private
	 * @param days 
	 * @param hours 
	 * @param minutes 
	 * @return A JavaScript Date object
	 */
	function _getDateFromNow(days, hours, minutes) {
		if (!days) {
			days = 0;
		}
		if (!hours) {
			hours = 0;
		}
		if (!minutes) {
			minutes = 0;
		}
		
		var timestamp = (new Date()).getTime();
		timestamp += 1000 * 60 * 60 * 24 * days;
		timestamp += 1000 * 60 * 60 * hours;
		timestamp += 1000 * 60 * minutes;
		
		return new Date(timestamp);
	}

	/**
	 * Used to update the 'card' state after it has been viewed.
	 * @private 
	 * @param card A card object that should have indexes 'en' and 'es', and optionally (if it originated from the cardPile) 'ef', 'interval', 'showNext' and 'n'.
	 * @param difficulty The rating from 0 - 5
	 * @return An updated 'card' to be pushed back into the cardPile
	 */
	function _getNewCard(card,difficulty) {
		var newEf = 2.5, newInterval = 1, newN = 1;
		if (card.ef) {
			newEf = card.ef + 
					(0.1 - (5.0 - parseFloat(difficulty)) * 
					(0.08 + (5.0 - parseFloat(difficulty)) * 0.02));
			if (newEf < 1.3) {
				newEf = 1.3;
			}
			newInterval = Math.ceil(card.interval * newEf);
			newN = card.n + 1;
			if (newN == 2) {
				newInterval = 6;
			}
		}
		
		var newCard = {
			ef: newEf,
			interval: newInterval,			
			showNext: _getDateFromNow(newInterval),
			n: newN,
			en: card.en,
			es: card.es
		}
		
		return newCard;
	}

	/**
	 * @param _datasource The datasource to pull entries from
	 */
	function setDatasource(_datasource) {
		datasource = _datasource;
	}

	/**
	 * Get the next card. This will either pull the card from the data file or from the card pile
	 */
	function getCard() {
		if (!localStorage) {
			// throw error
		}
		cardPile = JSON.parse(localStorage.getItem('cardPile'));
		
		if (cardPile && cardPile.length > 0) {
			if (config.cardFactor > Math.random()) {
				if((new Date()) > (new Date(cardPile[0].showNext))) {
					return cardPile[0];
				}
			}
		}
		
		dataPointer = localStorage.getItem('dataPointer');
		if (!dataPointer) {
			localStorage.setItem('dataPointer', 1);
		}
		return datasource.next();
	}

	/**
	 * 
	 * @param card 
	 * @param difficulty 
	 * @return
	 */	
	function replaceCard(card,difficulty) {
		cardPile = JSON.parse(localStorage.getItem('cardPile'));
		if (!cardPile) {
			cardPile = [];
		}

		// if this card is from the dictionary (ie: not a spaced repetition) we should advance the pointer
		dataPointer = localStorage.getItem('dataPointer');
		if (!card.ef && dataPointer) {
			datasource.setCounter(dataPointer);
			localStorage.setItem('dataPointer',++dataPointer);
		}

		// update the card
		var newCard = _getNewCard(card,difficulty);
		
		for (var i=0 ; i<cardPile.length ; i++) {
			// erase any existing card in the pile that matches this one
			if ((cardPile[i].en == newCard.en)&&(cardPile[i].es == newCard.es)) {
				cardPile.splice(i,1);
				break;
			}
		}
		
		var added = false;
		for (var i=0 ; i<cardPile.length ; i++) {
			// put this card in the right place
			if (newCard.showNext < cardPile[i].showNext) {
				cardPile.splice(i,0,[newCard]);
				added = true;
				break;
			}
		}
		if (!added) {
			// if this cards showNext time is after everything currently in the cardPile, add it at the end
			cardPile[cardPile.length] = newCard;
		}
		
		localStorage.setItem('cardPile', JSON.stringify(cardPile));
	}

	return {
		setDatasource: setDatasource,
		getCard: getCard,
		replaceCard: replaceCard
	}
} ());