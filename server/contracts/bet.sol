pragma solidity ^0.4.16;

contract Bet {
    struct Participant {
        bool bet_on_draw;
        bool bet_on_team1;
        address delegate;
    }

    address public oracle;

    Participant[] public participants;

    uint participant_count = 0;
    uint team1_count = 0;
    uint team2_count = 0;
    uint draw_count = 0;
    uint wager = 1;
    uint fee = 1;

    constructor(uint wager_, uint fee_) public {
        oracle = msg.sender;
        wager = wager_;
        fee = fee_;
    }

    function bet_draw() public{
        participants.push(Participant({
            bet_on_draw: true,
            bet_on_team1: false,
            delegate: msg.sender
            }));
        participant_count++;
        draw_count++;
    }

    function bet_team1() public{
        participants.push(Participant({
            bet_on_draw: false,
            bet_on_team1: true,
            delegate: msg.sender
            }));
        participant_count++;
        team1_count++;
    }

    function bet_team2() public{
        participants.push(Participant({
            bet_on_draw: false,
            bet_on_team1: false,
            delegate: msg.sender
            }));
        participant_count++;
        team2_count++;
    }

    function draw() public view
            returns (uint count){
        count = draw_count;
    }

    function team1() public view
            returns (uint count){
        count = team1_count;
    }

    function team2() public view
            returns (uint count){
        count = team2_count;
    }

    function win_on_draw() public view
            returns (uint win){
        win = wager * participant_count / draw_count - fee;
    }

    function win_on_team1() public view
            returns (uint win){
        win = wager * participant_count / team1_count - fee;
    }

    function win_on_team2() public view
            returns (uint win){
        win = wager * participant_count / team2_count - fee;
    }

    function end(bool draw, bool team1_won) public {
        if (msg.sender == oracle){
            uint win = wager;
            if(draw){
                win = win_on_draw();
                for(uint i = 0; i < participants.length; i++){
                    if(participants[i].bet_on_draw){
                        participants[i].delegate.transfer(win);
                    }
                }
            }else{
                if(team1_won){
                    win = win_on_team1();
                }else{
                    win = win_on_team2();
                }
                for(uint j = 0; j < participants.length; j++){
                    if(participants[j].bet_on_team1 == team1_won){
                        if(participants[j].bet_on_draw == false){
                            participants[j].delegate.transfer(win);
                        }
                    }
                }
            }
        }
    }
}