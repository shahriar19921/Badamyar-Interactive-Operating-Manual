function PopupCenter(pageURL, title,w,h,gapX,gapY) {
			var left = (screen.width/2)-(w/2)+gapX;
			var top = (screen.height/2)-(h/2)+gapY;
			var targetWin = window.open (pageURL, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
		} 

function newPopup(url) {
			popupWindow = window.open(
			url,'popUpWindow','height=700,width=950,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes')
		}