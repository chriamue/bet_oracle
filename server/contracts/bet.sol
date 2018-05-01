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
    mapping(uint => address) draw_participants;
    mapping(uint => address) team1_participants;
    mapping(uint => address) team2_participants;

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
        draw_participants[draw_count] = msg.sender;
        participant_count++;
        draw_count++;
    }

    function bet_team1() payable costs(_wager) public{
        team1_participants[team1_count] = msg.sender;
        participant_count++;
        team1_count++;
    }

    function bet_team2() payable costs(_wager) public{
        team2_participants[team2_count] = msg.sender;
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
                for(uint i = 0; i < draw_count; i++){
                    draw_participants[i].transfer(win);
                }
            }else{
                if(team1_won){
                    win = win_on_team1();
                    for(uint j = 0; j < team1_count; j++){
                        team1_participants[j].transfer(win);
                    }
                }else{
                    win = win_on_team2();
                    for(uint k = 0; k < team1_count; k++){
                        team1_participants[k].transfer(win);
                    }
                }
            }
            selfdestruct(oracle);
        }
    }
}
