from MoskaEngine.Play.play_in_browser import run_as_command_line_program,parse_args

def run_moska_in_browser_from_string():
    # Must be run from command line, because parse_args implicitly takes sys.argv
    args = parse_args()
    run_as_command_line_program(f"--name {args.name} --gameid {args.gameid}")

if __name__ == "__main__":
    #Example of how to run a game from the command line

    # Must be run from command line, because parse_args implicitly takes sys.argv
    args = parse_args()
    run_as_command_line_program(f"--name {args.name} --gameid {args.gameid}")