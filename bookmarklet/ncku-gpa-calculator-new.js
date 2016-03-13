// 採用新制
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
        // if domain is not ncku grade, redirect to homepage.
        if (document.domain == "qrys.sso2.ncku.edu.tw" || "140.116.165.71:8888" || "140.116.165.72:8888" || "140.116.165.73:8888") {
            var gpaTotal = 0,
                creditTotal = 0,
                coreGenTotal = [0, 0, 0, 0],
                overGenTotal = [0, 0, 0, 0];

            // get all the submit button name
            var semesterNames = getSemesterName();
            var allClass = [];
            // loop all the submit button
            $.each(semesterNames, function(key, name){
                var scoreAndCredit = [];
                //var html = getSemesterHtml(name);
                getSemesterHtml(name, function(html){
                //get each semester score and credit
                    scoreAndCredit = analyzeSemesterGrade(html, semesterNames);
                    gpaTotal = accAdd(gpaTotal, scoreAndCredit[0]);
                    creditTotal += scoreAndCredit[1];
                    allClass.push(scoreAndCredit[2]);
                    for (var i = 0; i < 4; i++) {
                        coreGenTotal[i] += scoreAndCredit[3][i];
                        overGenTotal[i] += scoreAndCredit[4][i];
                    };
                });
            })
            var gpaScoreNum = (gpaTotal / creditTotal);
            showResult(gpaScoreNum, gpaTotal, creditTotal, allClass, semesterNames, coreGenTotal, overGenTotal);
            resultCss();
        } else {
            window.location.href = "http://ncku-gpa.ctxhou.com/";
        }
    }

    function showResult(gpaScoreNum, gpaTotal, creditTotal, allClass, semesterNames, coreGen, overGen){
        //if it is not firefox, print the full result
        if(!$.support.mozilla){
            var header = "<h3>Your Avg. GPA: "+ gpaScoreNum + "</h3>";

            var thead0 = "<tr><td><b>核心通識</b></td><td><b>學分</b></td><td style='border-left: 1px solid black'><b>跨領域通識</b></td><td><b>學分</b></td></tr>"
            var tbody0 = "<tr><td>基礎國文</td><td>"+ coreGen[0] +"</td><td style='border-left: 1px solid black'>人文學</td><td>"+ overGen[0] +"</td></tr>" +
                         "<tr><td>英文</td><td>"+ coreGen[1] +"</td><td style='border-left: 1px solid black'>社會科學</td><td>"+ overGen[1] +"</td></tr>" +
                         "<tr><td>公民與歷史</td><td>"+ coreGen[2] +"</td><td style='border-left: 1px solid black'>自然與工程科學</td><td>"+ overGen[2] +"</td></tr>" +
                         "<tr><td>哲學與藝術</td><td>"+ coreGen[3] +"</td><td style='border-left: 1px solid black'>生命科學與健康</td><td>"+ overGen[3] +"</td></tr>";

            var thead = "<tr><th>課程名稱</th><th>學分</th><th>分數</th><th>GPA</th><th>等第制</th><th>GPA * 學分</th><th>通識</th></tr>";
            var tbody = ""
            for (var key in allClass){
                tbody = tbody + "<tr style='border-bottom: 1px solid white'><td style='padding-top: 20px; '>" + semesterNames[key]
                              + "</td><td>"
                              + "</td><td>"
                              + "</td><td>"
                              + "</td><td>"
                              + "</td><td>"
                              + "</td><td>"
                              + "</td></tr>";
                for(var detail in allClass[key]){
                    tbody = tbody + "<tr id='eachClass'><td>" + allClass[key][detail].className
                                  + "</td><td>" + allClass[key][detail].credit
                                  + "</td><td>" + allClass[key][detail].score
                                  + "</td><td id='eachGpaScoreNum' >" + allClass[key][detail].gpaScoreNum
                                  + "</td><td>" + allClass[key][detail].gpaScoreLetter
                                  + "</td><td id='eachGpaScoreNumTotal'>" + (allClass[key][detail].gpaScoreNum * 1000 * allClass[key][detail].credit) / 1000
                                  + "</td><td>" + allClass[key][detail].gen + "</td></tr>";
                }
            }
            $('body').append("<div id='my-score' style='padding: 10px;background-color:#f7f7f7; position:absolute; left: 25%; top: 0px'><button id='close'>close</button>"
                                + header
                                + "<h5>Your Total GPA: " + gpaTotal + "        Your Total credit: " + creditTotal + "</h5>"
                                + "<table id='firstTable'>"
                                + thead0
                                + tbody0
                                + "</table>"
                                + "<table id='secondTable' style='margin-top: 20px;'>"
                                + thead
                                + tbody
                                + "</table> </div>");
            $('#close').click(function(){
                $('#my-score').remove();
            })
        }else{
            alert("Your GPA: "+ gpaScoreNum);
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
              if (web.length == 718) return getSemesterHtml(name, callback);
              else return callback(web);
            }
        })
    }

    function analyzeSemesterGrade(html, semesterNames){
        var gpaScoreNumTotal = 0;
        var gpaScoreNum = 0;
        var gpaScoreLetter = "X";
        var creditPart = 0;
        //核心通識
        var coreGenPart = [0, 0, 0, 0];
        //跨領域
        var overGenPart = [0, 0, 0, 0];
        var json = [];

        html = html.replace(/(\/body|\/html)/i, "\/div")
           .replace(/html/i, "div class='html'")
           .replace(/body/i, "div class='body'");

        $(html).find("table[bgcolor='#66CCFF'] tr:gt(1):not(:last)").each(function(){
            gpaScoreNumTotal, gpaScoreNum = 0;
            gpaScoreLetter = "F";
            var className = $(this).find('td:eq('+ 3 + ') b').html();
            var credit = $(this).find('td:eq('+ 5 + ') b').html(); //學分
            var score = $(this).find('td:eq('+ 7 + ') b').html();  //分數
            var gen = $(this).find('td:eq('+ 9 + ') b').html();    //通識
            var origin = score;

            score = parseInt(score) || $(this).find('td:eq('+ 7 + ') b').html(); //if the score is not appropriate, assign -1

            if (typeof score === 'number' && score != null) {

                credit = parseInt(credit);
                //換算成4.3制
                gpaScoreNum = gpaScore(score);
                //A～F
                gpaScoreLetter = gpaLetter(gpaScoreNum);
                gpaScoreNumTotal = accAdd(gpaScoreNumTotal, gpaScoreNum * 1000 * credit / 1000);

                creditPart += credit;
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
            if (className !== null && className !== undefined){
                json.push({"className": className, "credit": credit, "score": score, "gpaScoreNum": gpaScoreNum, "gen": gen, "gpaScoreLetter": gpaScoreLetter});
            }
        })
        return [gpaScoreNumTotal, creditPart, json, coreGenPart, overGenPart];
    }

    function gpaLetter(score){
        var letter = "X";
        switch(score) {
            case 4.3:
                letter = "A+";
                break;
            case 4:
                letter = "A";
                break;
            case 3.7:
                letter = "A-";
                break;
            case 3.3:
                letter = "B+";
                break;
            case 3:
                letter = "B";
                break;
            case 2.7:
                letter = "B-";
                break;
            case 2.3:
                letter = "C+";
                break;
            case 2:
                letter = "C";
                break;
            case 1.7:
                letter = "C-";
                break;
            case 0:
                letter = "F";
                break;
        }

        return letter;
    }

    function gpaScore(score){
        var gpa = 0;
        if(score >= 90){
            gpa = 4.3;
        } else if (score >= 85 && score <= 89){
            gpa = 4;
        } else if (score >= 80 && score <= 84){
            gpa = 3.7;
        } else if (score >= 77 && score <= 79){
            gpa = 3.3;
        } else if (score >= 73 && score <= 76){
            gpa = 3;
        } else if (score >= 70 && score <= 72){
            gpa = 2.7;
        } else if (score >= 67 && score <= 69){
            gpa = 2.3;
        } else if (score >= 63 && score <= 66){
            gpa = 2;
        } else if (score >= 60 && score <= 62){
            gpa = 1.7;
        } else if (score == -1 || score <= 59){
            gpa = 0;
        }
        return gpa
    }

    function getSemesterName() {
        var semesterNames = [];
        $("input:submit").each(function(){
            var name = $(this).val();
            semesterNames.push(name);
        })
        return semesterNames;
    }

    function accAdd(arg1, arg2){
        var r1, r2, m;
        try {
            r1 = arg1.toString().split(".")[1].length
        } catch(e) {
            r1 = 0
        }
        try {
            r2 = arg2.toString().split(".")[1].length
        } catch(e) {
            r2 = 0
        }
        m = Math.pow(10, Math.max(r1, r2));
        return (arg1 * m + arg2 * m) / m;
    }

    function resultCss() {
        $('#secondTable > tbody > tr > th').css('background-color', '#0044BB');
        $('#secondTable > tbody > tr > th').css('color', 'white');
        $('#firstTable, #secondTable').css('border-collapse', 'collapse');
        $('#firstTable, #secondTable, #firstTable > tbody > tr > td, #firstTable > tbody > tr > th, #secondTable > tbody > tr > td, #secondTable > tbody > tr > th').css('border', '1px solid black');

        $('#eachClass #eachGpaScoreNum').each(function()
        {
            var gpa = parseFloat($(this).html());
            var score = parseFloat($(this).siblings('#eachGpaScoreNumTotal').html());

            if(score == 0)
                $(this).closest('tr').css('background-color', '#DDDDDD');
            else if(gpa >= 4)
                $(this).closest('tr').css('background-color', '#00FF00');
            else if(gpa >= 3 && gpa < 4)
                $(this).closest('tr').css('background-color', '#FFDD55');
            else if(gpa >= 2 && gpa < 3)
                $(this).closest('tr').css('background-color', '#FF8888');
            else if(gpa >= 0 && gpa < 2) {
                $(this).closest('tr').css('background-color', '#FF3333');
                $(this).closest('tr').css('color', 'white');
            }
        });
    }
})();
