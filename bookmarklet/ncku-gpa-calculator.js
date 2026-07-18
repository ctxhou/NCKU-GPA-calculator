// 採用舊制
(function() {
    // the minimum version of jQuery we want
    var v = "1.12.0";

    // check prior inclusion and version
    if (window.jQuery === undefined || window.jQuery.fn.jquery < v) {
        var done = false;
        var script = document.createElement("script");
        script.src = "https://ajax.googleapis.com/ajax/libs/jquery/" + v + "/jquery.min.js";
        script.onload = script.onreadystatechange = function(){
            if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
                done = true;
                initGPABookmarklet();
            }
        };
        document.getElementsByTagName("head")[0].appendChild(script);
    } else {
        initGPABookmarklet();
    }

    function initGPABookmarklet() {
        // add the new URL or NCKU.
        var d = document.domain;
        if (d === "qrys.ncku.edu.tw" || 
            d === "qrys.sso2.ncku.edu.tw" || 
            d === "140.116.165.71" || 
            d === "140.116.165.72" || 
            d === "140.116.165.73") {
            var gpaTotal = 0,
                creditTotal = 0,
                coreGenTotal = [0,0,0,0],
                overGenTotal = [0,0,0,0];

            // get all the submit button name
            var semesterNames = getSemesterName();
            // error check - cannot find semester button
            if (semesterNames.length === 0) {
                alert("錯誤：找不到學期資料。\n請確認您是否位於「成績查詢」頁面，且頁面上方有學期按鈕。");
                return;
            }
            
            var allClass = []
            // loop all the submit button
            $.each(semesterNames, function(key, name){
                var scoreAndCredit = []
                //get each semester score and credit
                getSemesterHtml(name, function(html){
                    scoreAndCredit = analyzeSemesterGrade(html, semesterNames)
                    gpaTotal = gpaTotal + scoreAndCredit[0]
                    creditTotal = creditTotal + scoreAndCredit[1]
                    allClass.push(scoreAndCredit[2])
                    for (var i = 0; i <4; i++) {
                        coreGenTotal[i] += scoreAndCredit[3][i];
                        overGenTotal[i] += scoreAndCredit[4][i];
                    };
                });
            })
            // error check - zero credits
            if (creditTotal === 0) {
                alert("警告：計算結果為 0 學分。\n這可能是因為網頁改版導致無法抓取成績表格，或者您尚未修課。");
            }
            var gpaScore = (gpaTotal / creditTotal)
            showResult(gpaScore, allClass, semesterNames, coreGenTotal, overGenTotal)
        } else {
            window.location.href = "http://ncku-gpa.sitw.tw/";
            alert("網域錯誤：本工具只能在成大成績查詢系統 (qrys.ncku.edu.tw) 使用。\n目前網域: " + d);
        }
    }

    function showResult(gpaScore, allClass, semesterNames, coreGen, overGen){
        //if it is not firefox, print the full result
        if(!$.support.mozilla){
            var header = "<h3>Your GPA: "+ gpaScore + "</h3>"
            var thead0 = "<tr><td><b>核心通識</b></td><td><b>學分</b></td><td style='border-left: 1px solid black'><b>跨領域通識</b></td><td><b>學分</b></td></tr>"
            var tbody0 = "<tr><td>基礎國文</td><td>"+ coreGen[0] +"</td><td style='border-left: 1px solid black'>人文學</td><td>"+ overGen[0] +"</td></tr>" +
                         "<tr><td>英文</td><td>"+ coreGen[1] +"</td><td style='border-left: 1px solid black'>社會科學</td><td>"+ overGen[1] +"</td></tr>" +
                         "<tr><td>公民與歷史</td><td>"+ coreGen[2] +"</td><td style='border-left: 1px solid black'>自然與工程科學</td><td>"+ overGen[2] +"</td></tr>" +
                         "<tr><td>哲學與藝術</td><td>"+ coreGen[3] +"</td><td style='border-left: 1px solid black'>生命科學與健康</td><td>"+ overGen[3] +"</td></tr>"

            var thead = "<tr><td>Class name</td><td>credit</td><td>score</td></tr>"
            var tbody = ""
            for (var key in allClass){
                tbody = tbody + "<tr style='border-bottom: 1px solid white'><td style='padding-top: 20px; '>" + semesterNames[key] + "</td></tr>"
                for(var detail in allClass[key]){
                    tbody = tbody + "<tr><td>" + allClass[key][detail].className
                                  + "</td><td>" + allClass[key][detail].credit
                                  + "</td><td>" + allClass[key][detail].score
                                  + "</td><td>" + allClass[key][detail].gen + "</td></tr>"
                }
            }
            $('body').append("<div id='my-score' style='padding: 10px;background-color:#f7f7f7; position:absolute; left: 25%; top: 0px'><button id='close'>close</button>"
                                + header
                                + "<table>"
                                + thead0
                                + tbody0
                                + "</table>"
                                + "<table style='margin-top: 20px;'>"
                                + thead
                                + tbody
                                + "</table> </div>")
            $('#close').click(function(){
                $('#my-score').remove();
            })
        }else{
            alert("Your GPA: "+ gpaScore)
        }
    }

    function getSemesterHtml(name, callback) {
        var html = null
        $.ajax({
            url: "?submit1="+name,
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            async : false, /**/
            processData : false,
            type: "POST",
            success: function(web){
              if (web.length <= 1000) return getSemesterHtml(name, callback);
              else return callback(web);
            }
        })
    }

    function analyzeSemesterGrade(html, semesterNames){
        var gpaPart = 0;
        var creditPart = 0;
        //核心通識
        var coreGenPart = [0,0,0,0];
        //跨領域
        var overGenPart = [0,0,0,0];
        var json = [];

        html = html.replace(/(\/body|\/html)/i, "\/div")
           .replace(/html/i, "div class='html'")
           .replace(/body/i, "div class='body'");

        $(html).find("table[bgcolor='#66CCFF'] tr:gt(1):not(:last)").each(function(){
            var className = $(this).find('td:eq('+ 3 + ') b').html()
            var credit = $(this).find('td:eq('+ 5 + ') b').html() //學分
            var score = $(this).find('td:eq('+ 7 + ') b').html()  //分數
            var gen = $(this).find('td:eq('+ 9 + ') b').html()    //通識
            var origin = score
            if (className !== null){
                json.push({"className": className, "credit": credit, "score": score, "gen": gen})
            }
            score = parseInt(score) || -1 //if the score is not appropriate, assign -1
            if (score != -1) {
                credit = parseInt(credit)
                score = gpaScore(score);
                gpaPart = gpaPart + score * credit
                creditPart = creditPart + credit
                switch(gen) {
                    case "人文學":
                        overGenPart[0] += credit;
                        break;
                    case "社會科學":
                        overGenPart[1] += credit;
                        break;
                    case "自然與工程科學":
                        overGenPart[2] += credit;
                        break;
                    case "生命科學與健康":
                        overGenPart[3] += credit;
                        break;
                    case "哲學與藝術":
                        coreGenPart[3] += credit;
                        break;
                    case "核心通識":
                        if(className.search("基礎國文") != -1)
                            coreGenPart[0] += credit;
                        if(className.search("英文") != -1)
                            coreGenPart[1] += credit;
                        if(className.search("公民與歷史") != -1)
                            coreGenPart[2] += credit;
                        break;
                }
            }
        })
        return [gpaPart, creditPart, json, coreGenPart, overGenPart]
    }

    function gpaScore(score){
        var gpa = 0;
        if(score >= 80){
            gpa = 4;
        }else if (score >= 70 && score <= 79){
            gpa = 3;
        }else if (score >= 60 && score <= 69){
            gpa = 2;
        }else if (score >= 50 && score <= 59){
            gpa = 1;
        }
        return gpa
    }
    function getSemesterName() {
        var semesterNames = [];
        $("input:submit").each(function(){
            var name = $(this).val()
            semesterNames.push(name)
        })
        return semesterNames
    }
})();
