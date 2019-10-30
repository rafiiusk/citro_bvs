sap.ui.define([], function() {
	"use strict";

	return {
		
		lockUnlockIcon : function(sValue) {
			if (!sValue) {
				return "sap-icon://unlocked";
			}else{
				return "sap-icon://locked";
			}
		},
		
		lockUnlockTip : function(sValue) {
			if (!sValue) {
				return "Desbloqueado";
			}else{
				return "Bloqueado";
			}
		},
		
		lockUnlockColor : function(sValue) {
			return sap.m.ButtonType.Default;
			/*if (!sValue) {
				return sap.m.ButtonType.Accept;
			}else{
				return sap.m.ButtonType.Reject;
			}*/
		},
		
		numberInt : function(sValue) {
			if (!sValue) {
				return "0";
			}

			return parseInt(sValue);
		},

		currencyInt : function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		currencyExt : function(fValue) {
			if (fValue && fValue != "") {
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
					minFractionDigits : 2,
					maxFractionDigits : 2,
					groupingEnabled : true,
					groupingSeparator : ".",
					decimalSeparator : ","
				});

				return oNumberFormat.format(fValue);
			}

			return fValue;
		},

		dateExt : function(sValue) {
			if (sValue) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern : "dd/MM/YYYY"
				});

				var dDate = undefined;

				if (sValue instanceof Date)
					dDate = sValue;
				else
					dDate = new Date(parseInt(sValue.substr(6)));

				var sLocal = dDate.toUTCString();
				dDate = new Date(sLocal.substr(0, 16));

				return oDateFormat.format(dDate);
			} else {
				return sValue;
			}
		}
	};

});