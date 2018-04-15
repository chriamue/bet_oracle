pragma solidity ^0.4.16;

contract Bet {
    struct Participant {
        bool bet_on_team1;
        address delegate;
    }

    address public oracle;

    Participant[] public participants;

    uint participant_count = 0;
    uint team1_count = 0;
    uint wager = 1;
    uint fee = 1;

    function Bet(uint wager_, uint fee_) public {
        oracle = msg.sender;
        wager = wager_;
        fee = fee_;
    }

    function bet(bool bet_on_team1) public {
        participants.push(Participant({
            bet_on_team1: bet_on_team1,
            delegate: msg.sender
            }));
        participant_count++;
        if(bet_on_team1){
            team1_count++;
        }
    }

    function bet_on_team1() public view
            returns (uint count){
        count = team1_count;
    }

    function bet_on_team2() public view
            returns (uint count){
        count = participant_count - team1_count;
    }

    function end(bool team1_won) public {
        if (msg.sender == oracle){
            uint win = wager;
            if(team1_won){
                win = win * participant_count / team1_count;
            }else{
                win = win * participant_count / (participant_count-team1_count);
            }
            win = win - fee;
            for(uint i = 0; i < participants.length; i++){
                if(participants[i].bet_on_team1 == team1_won){
                    participants[i].delegate.transfer(win);
                }
            }
        }
    }
}