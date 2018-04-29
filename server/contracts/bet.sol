pragma solidity ^0.4.16;

contract Bet {

    modifier costs(uint price) {
        if (msg.value >= price) {
            _;
        }
    }

    struct Participant {
        bool bet_on_draw;
        bool bet_on_team1;
        address delegate;
    }

    address public oracle;

    mapping(uint => Participant) participants;

    uint participant_count = 0;
    uint team1_count = 0;
    uint team2_count = 0;
    uint draw_count = 0;
    uint _wager = 1;
    uint _fee = 1;

    function Bet(uint wager_, uint fee_) public {
        oracle = msg.sender;
        _wager = wager_;
        _fee = fee_;
    }

    function bet_draw() payable costs(_wager) public{
        participants[participant_count] = Participant({
            bet_on_draw: true,
            bet_on_team1: false,
            delegate: msg.sender
            });
        participant_count++;
        draw_count++;
    }

    function bet_team1() payable costs(_wager) public{
        participants[participant_count] = Participant({
            bet_on_draw: false,
            bet_on_team1: true,
            delegate: msg.sender
            });
        participant_count++;
        team1_count++;
    }

    function bet_team2() payable costs(_wager) public{
        participants[participant_count] = Participant({
            bet_on_draw: false,
            bet_on_team1: false,
            delegate: msg.sender
            });
        participant_count++;
        team2_count++;
    }

    function wager() public view
            returns (uint w){
        w = _wager;
    }

    function fee() public view
            returns (uint f){
        f = _fee;
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
        win = _wager * participant_count / draw_count - _fee;
    }

    function win_on_team1() public view
            returns (uint win){
        win = _wager * participant_count / team1_count - _fee;
    }

    function win_on_team2() public view
            returns (uint win){
        win = _wager * participant_count / team2_count - _fee;
    }

    function end(bool draw_, bool team1_won) public {
        if (msg.sender == oracle){
            uint win = _wager;
            if(draw_){
                win = win_on_draw();
                for(uint i = 0; i < participant_count; i++){
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
                for(uint j = 0; j < participant_count; j++){
                    if(participants[j].bet_on_team1 == team1_won){
                        if(participants[j].bet_on_draw == false){
                            participants[j].delegate.transfer(win);
                        }
                    }
                }
            }
            selfdestruct(oracle);
        }
    }
}